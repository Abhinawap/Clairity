import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFile } from "parser";
import { EditorShell } from "../../components/editor-shell";
import { SessionProvider } from "../../data/session-provider";

// Parsed here on the server, so Babel is never bundled for the browser. No session ID yet means the fake extension.
const heroPath = join(process.cwd(), "../parser/test/fixtures/hero.tsx");

export default function EditorPage() {
  const code = readFileSync(heroPath, "utf8");
  return (
    <SessionProvider fixture={parseFile(code, "components/hero.tsx")}>
      <EditorShell sources={{ "components/hero.tsx": code }} />
    </SessionProvider>
  );
}
