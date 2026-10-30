import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFile } from "parser";
import type { Fixture } from "./fake-extension";

// The parser's hero fixture, which the fake extension serves: its scene graph and the source each Node's `source.file` points at.
// One loader for the page and the tests, so the file name the fake serves always matches the Nodes' `source.file`.
// Node only (it reads the disk): the page calls it on the server, so Babel is never bundled for the browser.
// Both the Next.js server and Vitest run from packages/web.
export function loadHeroFixture(): Fixture {
  const file = "components/hero.tsx";
  const code = readFileSync(join(process.cwd(), "../parser/test/fixtures/hero.tsx"), "utf8");
  return { file, code, roots: parseFile(code, file) };
}
