import type { ProtocolMessage } from "./protocol";
import type { ExtensionLink } from "./session";

// Must match the broker's expectations (packages/server/src/sessionBroker.ts): a WS URL with
// sessionId and role query params, so it can pair this socket with the extension's.
const BACKEND_WS_BASE_URL = "ws://localhost:8787";

// Real extension side of the protocol: a browser WebSocket to the session broker, paired with the
// extension's own socket by sessionId. Counterpart to fake-extension.ts's in-memory stand-in.
export function realExtension(sessionId: string): { link: ExtensionLink } {
  let socket: WebSocket | undefined;

  const link: ExtensionLink = {
    open(onMessage, onConnection) {
      socket = new WebSocket(`${BACKEND_WS_BASE_URL}?sessionId=${sessionId}&role=web`);

      socket.addEventListener("open", () => onConnection("connected"));

      socket.addEventListener("message", (event) => {
        try {
          onMessage(JSON.parse(event.data as string) as ProtocolMessage);
        } catch {
          // Malformed frame from the wire; drop it rather than crash the store.
        }
      });

      // ponytail: no reconnect yet (spec: "WebSocket drop -> both clients reconnect with the same
      // sessionId; the extension resends graph:full"); add once session-provider.tsx needs it.
    },
    send(message) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
  };

  return { link };
}
