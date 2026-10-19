import { readFileSync } from "node:fs";
import { parseFile } from "parser";
import { expect, it } from "vitest";
import type { GraphFullMessage } from "../data/protocol";

it("carries the parser's scene graph in a graph:full message", () => {
  const code = readFileSync(new URL("../../parser/test/fixtures/hero.tsx", import.meta.url), "utf8");
  const message: GraphFullMessage = { type: "graph:full", nodes: parseFile(code, "components/hero.tsx") };
  expect(message.nodes.map((n) => n.name)).toEqual(["section", "span"]);
});
