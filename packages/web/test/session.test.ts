import { readFileSync } from "node:fs";
import { type IRNode, parseFile } from "parser";
import { expect, it } from "vitest";
import { fakeExtension } from "../data/fake-extension";
import type { ProtocolMessage } from "../data/protocol";
import { createSession, findNode, selectedNode, textRun } from "../data/session";

const code = readFileSync(new URL("../../parser/test/fixtures/hero.tsx", import.meta.url), "utf8");
// The hero's scene graph, written out: packages/parser/test/parse.test.ts.
const roots = parseFile(code, "components/hero.tsx");
const all = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...all(n.children)]);
const byName = (name: string) => all(roots).find((n) => n.name === name)!;
// The fake replies on a later tick, like a real wire.
const wire = () => new Promise((resolve) => setTimeout(resolve));

it("holds the fake's scene graph, Read-only nodes and their reasons included", () => {
  const session = createSession(fakeExtension(roots).link);
  const { roots: held } = session.getState();
  expect(held).toEqual(roots);
  const readOnly = all(held).filter((n) => !n.editable);
  expect(readOnly.map((n) => n.name)).toEqual(["a", "span", "button"]);
  for (const n of readOnly) expect(n.reason).toEqual(expect.any(String));
});

it("reports itself connected to the fake", () => {
  expect(createSession(fakeExtension(roots).link).getState().connection).toBe("connected");
});

it("ignores messages meant for the extension and unknown types", () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  const before = session.getState();
  fake.emit({ type: "edit:apply", nodeId: roots[0].id, style: { width: "1px" } });
  fake.emit({ type: "source:read", file: "components/hero.tsx" });
  fake.emit({ type: "graph:wobble", nodes: [] } as unknown as ProtocolMessage);
  expect(session.getState()).toBe(before);
});

it("selects a Node without sending anything to the extension", () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  session.getState().select(byName("h1").id);
  expect(selectedNode(session.getState())).toEqual(byName("h1"));
  expect(fake.received).toEqual([]);
});

it("sends one Edit carrying every property, and shows it only once the extension confirms it", async () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  const image = byName("Image");
  session.getState().applyEdit(image.id, { width: "2.5rem", height: "2.5rem" });
  expect(fake.received).toEqual([{ type: "edit:apply", nodeId: image.id, style: { width: "2.5rem", height: "2.5rem" } }]);
  expect(findNode(session.getState().roots, image.id)?.style).toEqual({ borderRadius: "calc(infinity * 1px)" });
  await wire();
  expect(findNode(session.getState().roots, image.id)?.style).toEqual({ borderRadius: "calc(infinity * 1px)", width: "2.5rem", height: "2.5rem" });
});

it("sends nothing for an Edit on a Read-only node or an id not in the scene graph", async () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  const before = session.getState();
  session.getState().applyEdit(byName("button").id, { width: "1rem" });
  session.getState().applyEdit("components/hero.tsx:999:1:nope", { width: "1rem" });
  await wire();
  expect(fake.received).toEqual([]);
  expect(session.getState()).toBe(before);
});

it("keeps the edited Node selected, children included, after the extension confirms the Edit", async () => {
  const session = createSession(fakeExtension(roots).link);
  const h1 = byName("h1");
  session.getState().select(h1.id);
  session.getState().applyEdit(h1.id, { color: "#111827" });
  await wire();
  const selected = selectedNode(session.getState());
  expect(selected?.style.color).toBe("#111827");
  expect(selected?.children.map((n) => n.name)).toEqual(["#text", "br", "#text"]);
});

it("sends one text Edit for an element's text Node, and shows the new text only once the extension confirms it", async () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  const badge = roots[1];
  const text = badge.children[0];
  session.getState().applyText(badge.id, "Newer");
  expect(fake.received).toEqual([{ type: "text:apply", nodeId: text.id, text: "Newer" }]);
  expect(findNode(session.getState().roots, text.id)?.text).toBe("New");
  await wire();
  expect(findNode(session.getState().roots, text.id)?.text).toBe("Newer");
});

it("sends a text Edit for a Read-only element's text Node, since Read-only locks only its style", () => {
  const fake = fakeExtension(roots);
  const button = byName("button");
  createSession(fake.link).getState().applyText(button.id, "Learn Less");
  expect(fake.received).toEqual([{ type: "text:apply", nodeId: button.children[0].id, text: "Learn Less" }]);
});

it("sends nothing for a text Edit on an element whose children are not exactly one text Node, or an id not in the scene graph", async () => {
  const fake = fakeExtension(roots);
  const session = createSession(fake.link);
  const before = session.getState();
  for (const name of ["h1", "a", "ul"]) session.getState().applyText(byName(name).id, "Locked");
  session.getState().applyText("components/hero.tsx:999:1:nope", "Locked");
  await wire();
  expect(fake.received).toEqual([]);
  expect(session.getState()).toBe(before);
});

it("keeps the element selected after the extension confirms its text Edit", async () => {
  const session = createSession(fakeExtension(roots).link);
  const button = byName("button");
  session.getState().select(button.id);
  session.getState().applyText(button.id, "Learn Less");
  await wire();
  expect(selectedNode(session.getState())?.id).toBe(button.id);
  expect(textRun(selectedNode(session.getState()))?.text).toBe("Learn Less");
});
