import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Suspense } from "react";
import { parseFile } from "parser";
import { EditorShell } from "../../components/editor-shell";
import { SessionProvider } from "../../data/session-provider";

// Parsed here on the server, so Babel is never bundled for the browser. Used as the fallback fixture
// when no sessionId is in the URL; with one, SessionProvider connects for real and graph:full
// (sent by the extension on connect) replaces it.
const heroPath = join(process.cwd(), "../parser/test/fixtures/hero.tsx");

// searchParams is a request-time API; reading it outside Suspense would make the whole route
// opt out of prerendering under Cache Components. Isolated here so EditorPage's shell stays static.
async function EditorSession({ searchParams }: Pick<PageProps<"/editor">, "searchParams">) {
  const { sessionId } = await searchParams;
  const code = readFileSync(heroPath, "utf8");
  return (
    <SessionProvider sessionId={typeof sessionId === "string" ? sessionId : undefined} fixture={parseFile(code, "components/hero.tsx")}>
      <EditorShell sources={{ "components/hero.tsx": code }} />
    </SessionProvider>
  );
}

export default function EditorPage({ searchParams }: PageProps<"/editor">) {
  return (
    <Suspense fallback={null}>
      <EditorSession searchParams={searchParams} />
    </Suspense>
  );
}
