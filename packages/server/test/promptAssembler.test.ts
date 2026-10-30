import { readFileSync } from "node:fs";
import { parseFile } from "parser";
import { beforeEach, expect, it } from "vitest";
import { type ProposalEvent, type ProposalRequest, streamProposal } from "../src/promptAssembler";

const code = readFileSync(new URL("../../parser/test/fixtures/hero.tsx", import.meta.url), "utf8");
const roots = parseFile(code, "components/hero.tsx");
const all = (nodes: typeof roots): typeof roots => nodes.flatMap((n) => [n, ...all(n.children)]);
const byName = (name: string) => all(roots).find((n) => n.name === name)!;
const h1 = byName("h1");
const [builder] = h1.children.filter((n) => n.type === "text");
const req: ProposalRequest = { id: "p1", prompt: "More premium", scope: "page", nodes: roots, sources: [{ file: "components/hero.tsx", code }] };

beforeEach(() => {
  process.env.NEBIUS_API_KEY = "test-key";
});

// A stand-in for Token Factory: streams each reply as OpenAI-style server-sent events, a few characters at a time.
// refuseSchema answers 400 to response_format json_schema, as an endpoint without structured output would.
function tokenFactory(replies: string[], { refuseSchema = false } = {}) {
  const calls: { body: Record<string, unknown>; headers: Record<string, string> }[] = [];
  const fetchFn = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({ body, headers: init.headers as Record<string, string> });
    if (refuseSchema && (body.response_format as { type?: string })?.type === "json_schema") return new Response("response_format not supported", { status: 400 });
    const reply = replies.shift() ?? "";
    const chunks = reply.match(/[\s\S]{1,7}/g) ?? [];
    const sse = [...chunks.map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`), "data: [DONE]\n\n"].join("");
    return new Response(sse, { status: 200, headers: { "Content-Type": "text/event-stream" } });
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

async function collect(stream: AsyncGenerator<ProposalEvent>) {
  const events: ProposalEvent[] = [];
  for await (const e of stream) events.push(e);
  return events;
}
const finalProposal = (events: ProposalEvent[]) => {
  const last = events.at(-1);
  if (!last || !("proposal" in last)) throw new Error("no proposal");
  return last;
};

it("streams the model's text, then a Proposal whose Changes carry the scene graph's before-values", async () => {
  const reply = JSON.stringify({
    reasoning: "Darker, tighter heading.",
    changes: [
      { kind: "style", nodeId: h1.id, property: "color", value: "#0f172a", why: "contrast" },
      { kind: "text", nodeId: builder.id, value: "The visual editor you're", why: "sharper copy" },
      { kind: "class", nodeId: h1.id, add: ["tracking-tight"], remove: [], why: "premium feel" },
    ],
  });
  const { fetchFn, calls } = tokenFactory([`<think>planning</think>\`\`\`json\n${reply}\n\`\`\``]);
  const events = await collect(streamProposal(req, fetchFn));
  expect(events.filter((e) => "partial" in e).length).toBeGreaterThan(3);
  const { proposal, dropped } = finalProposal(events);
  expect(dropped).toEqual([]);
  expect(proposal).toEqual({
    id: "p1",
    intent: "More premium",
    scope: "page",
    reasoning: "Darker, tighter heading.",
    changes: [
      { id: "p1:1", kind: "style", nodeId: h1.id, property: "color", before: undefined, after: "#0f172a" },
      { id: "p1:2", kind: "text", nodeId: builder.id, before: "The website builder you're", after: "The visual editor you're" },
      { id: "p1:3", kind: "class", nodeId: h1.id, added: ["tracking-tight"], removed: [] },
    ],
  });
  expect(calls[0].body).toMatchObject({ model: "nvidia/nemotron-3-super-120b-a12b", stream: true });
  expect(calls[0].headers.Authorization).toBe("Bearer test-key");
});

it("drops Changes it can't apply (unknown node, Read-only node, unsupported property) and keeps the rest", async () => {
  const reply = JSON.stringify({
    reasoning: "r",
    changes: [
      { kind: "style", nodeId: "nope", property: "color", value: "#000", why: "" },
      { kind: "style", nodeId: byName("button").id, property: "width", value: "20rem", why: "" },
      { kind: "style", nodeId: h1.id, property: "letterSpacing", value: "1px", why: "" },
      { kind: "text", nodeId: h1.id, value: "not a text node", why: "" },
      { kind: "style", nodeId: h1.id, property: "fontSize", value: "var(--text-6xl)", why: "" },
    ],
  });
  const { proposal, dropped } = finalProposal(await collect(streamProposal(req, tokenFactory([reply]).fetchFn)));
  expect(proposal.changes).toEqual([{ id: "p1:1", kind: "style", nodeId: h1.id, property: "fontSize", before: "var(--text-5xl)", after: "var(--text-6xl)" }]);
  expect(dropped).toHaveLength(4);
});

it("falls back to JSON mode when the endpoint refuses the schema", async () => {
  const reply = JSON.stringify({ reasoning: "r", changes: [{ kind: "style", nodeId: h1.id, property: "color", value: "#111", why: "" }] });
  const { fetchFn, calls } = tokenFactory([reply], { refuseSchema: true });
  finalProposal(await collect(streamProposal(req, fetchFn)));
  expect(calls.map((c) => (c.body.response_format as { type: string }).type)).toEqual(["json_schema", "json_object"]);
});

it("retries once with the problem appended when the first reply can't be used", async () => {
  const good = JSON.stringify({ reasoning: "r", changes: [{ kind: "style", nodeId: h1.id, property: "color", value: "#111", why: "" }] });
  const { fetchFn, calls } = tokenFactory(["Sure! Here are some ideas.", good]);
  finalProposal(await collect(streamProposal(req, fetchFn)));
  expect(calls).toHaveLength(2);
  const retryMessages = calls[1].body.messages as { role: string; content: string }[];
  expect(retryMessages.at(-1)?.content).toMatch(/could not be used: The model's reply holds no JSON object/);
});

it("gives up after the retry, and without a key says so", async () => {
  await expect(collect(streamProposal(req, tokenFactory(["no json", "still none"]).fetchFn))).rejects.toThrow(/no JSON object/);
  delete process.env.NEBIUS_API_KEY;
  await expect(collect(streamProposal(req, tokenFactory([]).fetchFn))).rejects.toThrow(/NEBIUS_API_KEY is not set/);
});
