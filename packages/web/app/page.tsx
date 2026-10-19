import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFile } from "parser";
import { SceneGraphDump } from "./scene-graph-dump";

// Parsed here on the server, so Babel is never bundled for the browser. No session ID yet means the fake extension.
const heroPath = join(process.cwd(), "../parser/test/fixtures/hero.tsx");

export default function Home() {
  return <SceneGraphDump roots={parseFile(readFileSync(heroPath, "utf8"), "components/hero.tsx")} />;
}
