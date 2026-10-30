import { Suspense } from "react";
import { EditorShell } from "../../components/editor-shell";
import { loadHeroFixture } from "../../data/hero-fixture";
import { SessionProvider } from "../../data/session-provider";

// The extension opens /editor?session=<id>, which connects to the broker for that session; without one, the fake
// extension serves the hero fixture. The fixture is loaded here on the server, so Babel is never bundled for the browser.
// searchParams is a request-time API, so it is read inside Suspense and the page's shell stays prerendered.
async function EditorSession({ searchParams }: Pick<PageProps<"/editor">, "searchParams">) {
  const { session } = await searchParams;
  return (
    <SessionProvider sessionId={typeof session === "string" && session ? session : undefined} fixture={loadHeroFixture()}>
      <EditorShell />
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
