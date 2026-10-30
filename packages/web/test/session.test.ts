import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { fakeExtension } from "../data/fake-extension";
import { loadHeroFixture } from "../data/hero-fixture";
import type { ProtocolMessage } from "../data/protocol";
import { createSession, findNode, flatten, selectedNode, textRuns } from "../data/session";

const hero = loadHeroFixture();
// The hero's scene graph, written out: packages/parser/test/parse.test.ts.
const { roots } = hero;
const all = flatten;
const byName = (name: string) => all(roots).find((n) => n.name === name)!;
// The fake replies on a later tick, like a real wire.
const wire = () => new Promise((resolve) => setTimeout(resolve));

it("holds the fake's scene graph, Read-only nodes and their reasons included", () => {
  const session = createSession(fakeExtension(hero).link);
  const { roots: held } = session.getState();
  expect(held).toEqual(roots);
  const readOnly = all(held).filter((n) => !n.editable);
  expect(readOnly.map((n) => n.name)).toEqual(["a", "span", "button"]);
  for (const n of readOnly) expect(n.reason).toEqual(expect.any(String));
});

it("reports itself connected to the fake", () => {
  expect(createSession(fakeExtension(hero).link).getState().connection).toBe("connected");
});

it("ignores messages meant for the extension and unknown types", () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const before = session.getState();
  fake.emit({ type: "edit:apply", nodeId: roots[0].id, style: { width: "1px" } });
  fake.emit({ type: "source:read", file: "components/hero.tsx" });
  fake.emit({ type: "graph:wobble", nodes: [] } as unknown as ProtocolMessage);
  expect(session.getState()).toBe(before);
});

it("selects a Node without sending anything to the extension", () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  session.getState().select(byName("h1").id);
  expect(selectedNode(session.getState())).toEqual(byName("h1"));
  expect(fake.received).toEqual([]);
});

it("sends one Edit carrying every property, and shows it only once the extension confirms it", async () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const image = byName("Image");
  session.getState().applyEdit(image.id, { width: "2.5rem", height: "2.5rem" });
  expect(fake.received).toEqual([{ type: "edit:apply", nodeId: image.id, style: { width: "2.5rem", height: "2.5rem" } }]);
  expect(findNode(session.getState().roots, image.id)?.style).toEqual({ borderRadius: "calc(infinity * 1px)" });
  await wire();
  expect(findNode(session.getState().roots, image.id)?.style).toEqual({ borderRadius: "calc(infinity * 1px)", width: "2.5rem", height: "2.5rem" });
});

it("sends nothing for an Edit on a Read-only node or an id not in the scene graph", async () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const before = session.getState();
  session.getState().applyEdit(byName("button").id, { width: "1rem" });
  session.getState().applyEdit("components/hero.tsx:999:1:nope", { width: "1rem" });
  await wire();
  expect(fake.received).toEqual([]);
  expect(session.getState()).toBe(before);
});

it("keeps the edited Node selected, children included, after the extension confirms the Edit", async () => {
  const session = createSession(fakeExtension(hero).link);
  const h1 = byName("h1");
  session.getState().select(h1.id);
  session.getState().applyEdit(h1.id, { color: "#111827" });
  await wire();
  const selected = selectedNode(session.getState());
  expect(selected?.style.color).toBe("#111827");
  expect(selected?.children.map((n) => n.name)).toEqual(["#text", "br", "#text"]);
});

it("lists a Node's own text runs, or a text run itself", () => {
  const texts = (name: string) => textRuns(byName(name)).map((run) => run.text);
  expect(texts("h1")).toEqual(["The website builder you're", "looking for"]);
  expect(texts("a")).toEqual(["Start"]);
  expect(texts("div")).toEqual([]);
  const start = byName("a").children[0];
  expect(textRuns(start)).toEqual([start]);
});

it("sends one text Edit for a text run, and shows the new text only once the extension confirms it", async () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const [builder, looking] = textRuns(byName("h1"));
  session.getState().applyText(looking.id, "searching for");
  expect(fake.received).toEqual([{ type: "text:apply", nodeId: looking.id, text: "searching for" }]);
  expect(findNode(session.getState().roots, looking.id)?.text).toBe("looking for");
  await wire();
  expect(findNode(session.getState().roots, looking.id)?.text).toBe("searching for");
  expect(findNode(session.getState().roots, builder.id)?.text).toBe("The website builder you're");
});

it("sends nothing for a text Edit on an id that is not a text run, a Read-only text run, or an id not in the scene graph", async () => {
  // The parser marks no text run Read-only today, so this test marks "Start" Read-only by hand.
  const rootsWithReadOnlyStart = structuredClone(roots);
  const [start] = textRuns(findNode(rootsWithReadOnlyStart, byName("a").id));
  start.editable = false;
  const fake = fakeExtension({ ...hero, roots: rootsWithReadOnlyStart });
  const session = createSession(fake.link);
  const before = session.getState();
  for (const id of [byName("h1").id, start.id, "components/hero.tsx:999:1:nope"]) session.getState().applyText(id, "Nothing");
  await wire();
  expect(fake.received).toEqual([]);
  expect(session.getState()).toBe(before);
});

it("keeps a Read-only element's text runs editable, and the element selected once the extension confirms one", async () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const button = byName("button");
  const [learnMore] = textRuns(button);
  session.getState().select(button.id);
  session.getState().applyText(learnMore.id, "Learn Less");
  expect(fake.received).toEqual([{ type: "text:apply", nodeId: learnMore.id, text: "Learn Less" }]);
  await wire();
  expect(selectedNode(session.getState())?.id).toBe(button.id);
  expect(textRuns(selectedNode(session.getState()))[0].text).toBe("Learn Less");
});

it("reads a Node's source file: sends source:read for its path, and holds the fake's source:content under that path", async () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const { file } = byName("h1").source;
  session.getState().readSource(file);
  expect(fake.received).toEqual([{ type: "source:read", file }]);
  expect(session.getState().sources).toEqual({});
  await wire();
  expect(session.getState().sources).toEqual({ [file]: readFileSync(new URL("../../parser/test/fixtures/hero.tsx", import.meta.url), "utf8") });
});

it("holds nothing for a file the fake does not serve", async () => {
  const session = createSession(fakeExtension(hero).link);
  session.getState().readSource("components/missing.tsx");
  await wire();
  expect(session.getState().sources).toEqual({});
});

it("requests a node-scoped Proposal with the prompt and the Node id, and a page-scoped one with an empty Node id", () => {
  const fake = fakeExtension(hero);
  const session = createSession(fake.link);
  const h1 = byName("h1");
  session.getState().requestProposal({ scope: "node", prompt: "More premium", nodeId: h1.id });
  session.getState().requestProposal({ scope: "page", prompt: "Responsive for mobile", nodeId: h1.id });
  expect(fake.received).toEqual([
    { type: "intent:request", scope: "node", prompt: "More premium", nodeId: h1.id },
    { type: "intent:request", scope: "page", prompt: "Responsive for mobile", nodeId: "" },
  ]);
});

it("shows a streaming Proposal's raw text, then holds the finished Proposal and clears the streaming text", async () => {
  const session = createSession(fakeExtension(hero).link);
  const seen: { streaming: string; proposal?: unknown }[] = [];
  session.subscribe(({ streaming, proposal }) => seen.push({ streaming, proposal }));
  session.getState().requestProposal({ scope: "node", prompt: "More premium", nodeId: byName("h1").id });
  expect(session.getState().streaming).toBe("");
  await wire();
  const { proposal } = session.getState();
  expect(seen).toEqual([
    { streaming: JSON.stringify(proposal), proposal: undefined },
    { streaming: "", proposal },
  ]);
  expect(proposal).toMatchObject({ intent: "More premium", scope: "node" });
});

it("streams a canned Proposal whose Changes target editable hero Nodes, with at least one style and one text Change", async () => {
  const session = createSession(fakeExtension(hero).link);
  session.getState().requestProposal({ scope: "page", prompt: "Anything" });
  await wire();
  const changes = session.getState().proposal?.changes ?? [];
  expect(new Set(changes.map((c) => c.id)).size).toBe(changes.length);
  expect(changes.map((c) => c.kind)).toEqual(expect.arrayContaining(["style", "text"]));
  for (const c of changes) {
    const target = "nodeId" in c ? findNode(roots, c.nodeId) : undefined;
    expect(target?.editable).toBe(true);
    if (c.kind === "text") expect(target?.type).toBe("text");
  }
});

// A session holding the fake's canned Proposal: style color and fontSize on the h1, and new text on its first run.
async function withProposal(fake = fakeExtension(hero)) {
  const session = createSession(fake.link);
  session.getState().requestProposal({ scope: "node", prompt: "More premium", nodeId: byName("h1").id });
  await wire();
  return { fake, session, proposal: session.getState().proposal! };
}
const changeId = (proposal: { changes: { id: string }[] }, suffix: string) => proposal.changes.find((c) => c.id.endsWith(suffix))!.id;

it("accepts every Change: sends them all, shows the new style and text after the patch, and clears the Proposal", async () => {
  const { fake, session, proposal } = await withProposal();
  const ids = proposal.changes.map((c) => c.id);
  session.getState().applyProposal(ids);
  expect(fake.received.at(-1)).toEqual({ type: "proposal:apply", proposalId: proposal.id, acceptedChangeIds: ids });
  expect(session.getState().proposal).toEqual(proposal);
  await wire();
  const h1 = findNode(session.getState().roots, byName("h1").id)!;
  expect(h1.style).toMatchObject({ color: "#0f172a", fontSize: "var(--text-6xl)" });
  expect(textRuns(h1).map((run) => run.text)).toEqual(["The visual editor you're", "looking for"]);
  expect(session.getState().proposal).toBeUndefined();
});

it("accepts a subset: applies only those Changes and leaves Nodes targeted only by rejected Changes alone", async () => {
  const { session, proposal } = await withProposal();
  session.getState().applyProposal([changeId(proposal, ":text")]);
  await wire();
  const h1 = findNode(session.getState().roots, byName("h1").id)!;
  expect(h1.style).toEqual(byName("h1").style);
  expect(textRuns(h1)[0].text).toBe("The visual editor you're");
  expect(session.getState().proposal).toBeUndefined();
});

it("rejects every Change: sends no ids, leaves the scene graph unchanged and clears the Proposal", async () => {
  const { fake, session, proposal } = await withProposal();
  const rootsBefore = session.getState().roots;
  session.getState().applyProposal([]);
  expect(fake.received.at(-1)).toEqual({ type: "proposal:apply", proposalId: proposal.id, acceptedChangeIds: [] });
  await wire();
  expect(session.getState().roots).toBe(rootsBefore);
  expect(session.getState().proposal).toBeUndefined();
});

it("keeps the Proposal and the scene graph and holds the extension's message when it refuses to apply a Change", async () => {
  const button = byName("button");
  // A Proposal that also restyles the hero's Read-only spread-props button.
  const fake = fakeExtension(hero, {
    propose: (p) => ({ ...p, changes: [...p.changes, { id: `${p.id}:button`, kind: "style", nodeId: button.id, property: "width", before: "15rem", after: "20rem" }] }),
  });
  const { session, proposal } = await withProposal(fake);
  const rootsBefore = session.getState().roots;
  session.getState().applyProposal(proposal.changes.map((c) => c.id));
  await wire();
  expect(session.getState().lastError).toEqual(expect.stringContaining("Read-only"));
  expect(session.getState().proposal).toEqual(proposal);
  expect(session.getState().roots).toBe(rootsBefore);
});

it("sends nothing when no Proposal is pending", () => {
  const fake = fakeExtension(hero);
  createSession(fake.link).getState().applyProposal(["anything"]);
  expect(fake.received).toEqual([]);
});
