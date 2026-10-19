import { readFileSync } from "node:fs";
import { type IRNode, parseFile } from "parser";
import { expect, it } from "vitest";
import { fakeExtension } from "../data/fake-extension";
import type { ProtocolMessage } from "../data/protocol";
import { createSession } from "../data/session";

const code = readFileSync(new URL("../../parser/test/fixtures/hero.tsx", import.meta.url), "utf8");
const roots = parseFile(code, "components/hero.tsx");
const all = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...all(n.children)]);

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
