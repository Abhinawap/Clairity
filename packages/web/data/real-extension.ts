import type { ProtocolMessage } from "./protocol";
import type { ExtensionLink } from "./session";

// The broker's address. The broker pairs this socket with the extension's by the sessionId and role on the URL
// (packages/server/src/sessionBroker.ts). Set NEXT_PUBLIC_BROKER_URL when the broker runs anywhere but this machine.
export const BROKER_URL = process.env.NEXT_PUBLIC_BROKER_URL ?? "ws://localhost:8787";

// How long to wait before each reconnect after a drop: it grows from the first value to the last and stays there.
const RETRY_DELAYS_MS = [250, 500, 1000, 2000, 5000];

// The extension side of the protocol for a real session: a WebSocket to the broker, paired with the extension's
// socket by session ID. After a drop it reports "disconnected" and keeps reconnecting; on reconnect the broker asks
// the extension to resend graph:full, which replaces the scene graph (project spec, failure handling).
export function realExtension(sessionId: string, brokerUrl = BROKER_URL): { link: ExtensionLink } {
  let socket: WebSocket | undefined;
  let closed = false;
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const link: ExtensionLink = {
    kind: "broker",
    open(onMessage, onConnection) {
      closed = false;
      const connect = () => {
        const url = new URL(brokerUrl);
        url.searchParams.set("sessionId", sessionId);
        url.searchParams.set("role", "web");
        const ws = new WebSocket(url);
        socket = ws;
        ws.addEventListener("open", () => {
          attempt = 0;
          onConnection("connected");
        });
        ws.addEventListener("message", (event) => {
          try {
            onMessage(JSON.parse(String(event.data)) as ProtocolMessage);
          } catch {
            // A malformed frame is dropped rather than crashing the store.
          }
        });
        // A failed connect fires close too, so retrying lives here only.
        ws.addEventListener("close", () => {
          if (closed || socket !== ws) return;
          onConnection("disconnected");
          retry = setTimeout(connect, RETRY_DELAYS_MS[Math.min(attempt++, RETRY_DELAYS_MS.length - 1)]);
        });
      };
      connect();
    },
    send(message) {
      // ponytail: a message sent while disconnected is dropped, like an Edit the extension never confirms; queue it if that bites
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
    close() {
      closed = true;
      clearTimeout(retry);
      socket?.close();
    },
  };

  return { link };
}
