import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFile } from "parser";
import { SessionProvider } from "../data/session-provider";
import { SceneGraphDump } from "./scene-graph-dump";

// Parsed here on the server, so Babel is never bundled for the browser. No session ID yet means the fake extension.
const heroPath = join(process.cwd(), "../parser/test/fixtures/hero.tsx");

export default function Home() {
  return (
    <SessionProvider fixture={parseFile(readFileSync(heroPath, "utf8"), "components/hero.tsx")}>
      <SceneGraphDump />
    </SessionProvider>
  );
}
