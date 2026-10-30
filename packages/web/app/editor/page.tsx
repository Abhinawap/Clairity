import { EditorShell } from "../../components/editor-shell";
import { loadHeroFixture } from "../../data/hero-fixture";
import { SessionProvider } from "../../data/session-provider";

// Loaded here on the server, so Babel is never bundled for the browser. No session ID yet means the fake extension.
export default function EditorPage() {
  return (
    <SessionProvider fixture={loadHeroFixture()}>
      <EditorShell />
    </SessionProvider>
  );
}
