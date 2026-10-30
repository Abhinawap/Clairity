import type { IRNode, Proposal } from "shared";

// Nebius Token Factory speaks the OpenAI chat-completions API. Both are settings so a regional endpoint or another
// NVIDIA model needs no rebuild.
const BASE_URL = () => (process.env.TOKEN_FACTORY_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");
export const MODEL = () => process.env.TOKEN_FACTORY_MODEL ?? "nvidia/nemotron-3-super-120b-a12b";
const TIMEOUT_MS = 120_000;

// The style properties the inspector edits, in the values the scene graph uses.
const STYLE_PROPERTIES = [
  "width", "height", "borderRadius", "backgroundColor", "color", "fontSize", "fontWeight", "padding", "margin",
] as const;

export type ProposalRequest = {
  id: string;
  prompt: string;
  scope: "node" | "page";
  // The selected Node (node scope) or the shown file's roots (page scope), children included.
  nodes: IRNode[];
  sources: { file: string; code: string }[];
};

// What the model is asked to return: a flat Change list, which every structured-output implementation accepts
// (the open question in project-spec 2.6 about unions), turned into the shared Change types after validation.
const MODEL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reasoning: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["style", "text", "class"] },
          nodeId: { type: "string" },
          property: { type: "string" },
          value: { type: "string" },
          add: { type: "array", items: { type: "string" } },
          remove: { type: "array", items: { type: "string" } },
          why: { type: "string" },
        },
        required: ["kind", "nodeId", "why"],
      },
    },
  },
  required: ["reasoning", "changes"],
};

type ModelChange = { kind: string; nodeId: string; property?: string; value?: string; add?: string[]; remove?: string[]; why?: string };

const flatten = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);

// The nodes as the model sees them: only what it may change, without source positions it has no use for.
function describe(node: IRNode): unknown {
  return {
    nodeId: node.id,
    ...(node.type === "text"
      ? { text: node.text }
      : { tag: node.name, line: node.source.line, style: node.style, ...(node.passthroughClasses?.length ? { otherClasses: node.passthroughClasses } : {}) }),
    ...(node.editable ? {} : { readOnly: node.reason }),
    ...(node.children.length ? { children: node.children.map(describe) } : {}),
  };
}

export function messages(req: ProposalRequest) {
  const system = `You are Clairity's design assistant. You restyle an existing React/Next.js page that uses Tailwind CSS,
by proposing small Changes to the nodes you are shown. You never rewrite the page.

Return JSON only, matching this shape:
{"reasoning": "<one sentence for the developer>", "changes": [<Change>, ...]}

A Change is one of:
- {"kind":"style","nodeId":"<id>","property":"<property>","value":"<CSS value>","why":"<short reason>"}
  property is one of: ${STYLE_PROPERTIES.join(", ")}. value is a CSS value such as "2.5rem", "#0f172a",
  "var(--color-slate-900)", "var(--text-6xl)" or "var(--font-weight-semibold)". padding and margin take a JSON
  object string: {"top":"1rem","right":"2rem","bottom":"1rem","left":"2rem"}.
- {"kind":"text","nodeId":"<id of a text node>","value":"<new text>","why":"<short reason>"}
- {"kind":"class","nodeId":"<id>","add":["<tailwind class>"],"remove":["<existing class>"],"why":"<short reason>"}
  Use class Changes for anything style cannot express (shadows, gradients, tracking, responsive md:/lg: variants).
  Only remove classes the node has.

Rules: use only nodeIds you were shown. Never change a node marked readOnly (its text children may still change).
Propose 3 to 8 Changes that together answer the request.`;
  const user = `Request: ${req.prompt}
Scope: ${req.scope === "node" ? "the selected node and its children" : "the whole page"}

Nodes:
${JSON.stringify(req.nodes.map(describe), null, 1)}

Source:
${req.sources.map((s) => `// ${s.file}\n${s.code}`).join("\n\n")}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** The JSON object in a model reply: without reasoning blocks or code fences, from the first { to the last }. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The model's reply holds no JSON object");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Turns the model's reply into a Proposal, keeping only Changes the extension can apply: a known nodeId, an
 * editable target, a supported property, a text Change on a text node. Fills each Change's before-value from
 * the scene graph, so the diff list shows what the code says now rather than what the model remembers.
 */
export function toProposal(req: ProposalRequest, reply: unknown): { proposal: Proposal; dropped: string[] } {
  const r = reply as { reasoning?: unknown; changes?: unknown };
  if (!Array.isArray(r?.changes)) throw new Error("The model's reply has no changes list");
  const nodes = new Map(flatten(req.nodes).map((n) => [n.id, n]));
  const dropped: string[] = [];
  const changes: Proposal["changes"] = [];
  for (const raw of r.changes as ModelChange[]) {
    const node = nodes.get(raw?.nodeId);
    const id = `${req.id}:${changes.length + 1}`;
    const skip = (why: string) => dropped.push(`${raw?.kind ?? "?"} on ${raw?.nodeId ?? "?"}: ${why}`);
    if (!node) {
      skip("not a node it was shown");
    } else if (raw.kind === "text") {
      if (node.type !== "text") skip("not a text node");
      else if (typeof raw.value !== "string" || !raw.value.trim()) skip("empty text");
      else changes.push({ id, kind: "text", nodeId: node.id, before: node.text, after: raw.value.trim() });
    } else if (!node.editable) {
      skip(`read-only: ${node.reason}`);
    } else if (raw.kind === "style") {
      const property = raw.property as (typeof STYLE_PROPERTIES)[number];
      if (!STYLE_PROPERTIES.includes(property)) skip(`unsupported property ${raw.property}`);
      else if (typeof raw.value !== "string" || !raw.value.trim()) skip("no value");
      else {
        let after = raw.value.trim();
        if (property === "padding" || property === "margin") {
          try {
            const box = JSON.parse(after);
            if (!["top", "right", "bottom", "left"].every((k) => typeof box[k] === "string")) throw new Error();
            after = JSON.stringify(box);
          } catch {
            skip(`${property} is not a box`);
            continue;
          }
        }
        const before = node.style[property];
        changes.push({ id, kind: "style", nodeId: node.id, property, before: typeof before === "object" ? JSON.stringify(before) : before, after });
      }
    } else if (raw.kind === "class") {
      const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && /^\S+$/.test(x)) : []);
      const added = strings(raw.add);
      const removed = strings(raw.remove);
      if (!added.length && !removed.length) skip("adds and removes nothing");
      else changes.push({ id, kind: "class", nodeId: node.id, added, removed });
    } else {
      skip("unknown kind");
    }
  }
  if (!changes.length) throw new Error(`The model proposed no Change Clairity can apply${dropped.length ? ` (${dropped.join("; ")})` : ""}`);
  const reasoning = typeof r.reasoning === "string" ? r.reasoning : undefined;
  return { proposal: { id: req.id, intent: req.prompt, scope: req.scope, changes, reasoning }, dropped };
}

type Fetch = typeof fetch;

// One streamed chat completion: yields text as it arrives (answer and, for reasoning models, the reasoning), and
// returns the answer. Asks for the schema first, then plain JSON mode, then no format, if the endpoint refuses one.
async function* complete(req: ProposalRequest, fetchFn: Fetch, extra: { role: string; content: string }[] = []): AsyncGenerator<string, string> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY is not set on the Clairity server");
  const formats = [{ type: "json_schema", json_schema: { name: "Proposal", schema: MODEL_SCHEMA, strict: true } }, { type: "json_object" }, undefined];
  let res: Response | undefined;
  for (const response_format of formats) {
    res = await fetchFn(`${BASE_URL()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL(), messages: [...messages(req), ...extra], stream: true, temperature: 0.4, max_tokens: 4096, ...(response_format ? { response_format } : {}) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 400/422 mean the request shape was refused (likely the format); anything else is a real failure.
    if (res.status !== 400 && res.status !== 422) break;
  }
  if (!res!.ok || !res!.body) throw new Error(`Token Factory answered ${res!.status}: ${(await res!.text()).slice(0, 300)}`);

  let answer = "";
  let buffered = "";
  const decoder = new TextDecoder();
  for await (const chunk of res!.body as unknown as AsyncIterable<Uint8Array>) {
    buffered += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return answer;
      const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string; reasoning_content?: string } }[] }).choices?.[0]?.delta;
      if (delta?.reasoning_content) yield delta.reasoning_content;
      if (delta?.content) {
        answer += delta.content;
        yield delta.content;
      }
    }
  }
  return answer;
}

export type ProposalEvent = { partial: string } | { proposal: Proposal; dropped: string[] };

/**
 * Asks the model for a Proposal, streaming its text as it arrives. A reply that isn't valid JSON, or proposes
 * nothing applicable, is retried once with the problem appended (project spec, failure handling).
 */
export async function* streamProposal(req: ProposalRequest, fetchFn: Fetch = fetch): AsyncGenerator<ProposalEvent> {
  yield { partial: `Asking ${MODEL()} on Nebius Token Factory…\n` };
  let extra: { role: string; content: string }[] = [];
  for (let attempt = 1; ; attempt++) {
    const stream = complete(req, fetchFn, extra);
    let next = await stream.next();
    while (!next.done) {
      yield { partial: next.value };
      next = await stream.next();
    }
    try {
      yield toProposal(req, extractJson(next.value));
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      extra = [
        { role: "assistant", content: next.value },
        { role: "user", content: `That reply could not be used: ${(err as Error).message}. Answer again with JSON only, following the rules.` },
      ];
      yield { partial: `\nRetrying: ${(err as Error).message}\n` };
    }
  }
}
