import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";

type Role = "extension" | "web";

type SessionPair = {
  extension?: WebSocket;
  web?: WebSocket;
};

const sessions = new Map<string, SessionPair>();

export function attachSessionBroker(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const sessionId = url.searchParams.get("sessionId");
    const role = url.searchParams.get("role") as Role | null;

    if (!sessionId || (role !== "extension" && role !== "web")) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      registerSocket(sessionId, role, ws);
    });
  });

  console.log("[server] session broker attached to HTTP server");
}

function registerSocket(sessionId: string, role: Role, ws: WebSocket) {
  const pair = sessions.get(sessionId) ?? {};
  const previousExtension = role === "web" ? pair.extension : undefined;
  pair[role] = ws;
  sessions.set(sessionId, pair);

  console.log(`[server] ${role} connected for session ${sessionId}`);

  // The extension sends graph:full exactly once, right when its own socket opens. A web client that
  // connects (or reconnects, e.g. on page reload) any time after that would otherwise see an empty
  // scene graph forever, since nothing here buffers or replays it. Tell the extension a peer just
  // joined so it can resend graph:full — same message shape a real protocol message would have, but
  // synthesized here rather than relayed, since no "peer" sent it.
  if (role === "web" && previousExtension?.readyState === WebSocket.OPEN) {
    previousExtension.send(JSON.stringify({ type: "peer:joined", role: "web" }));
  }

  ws.on("message", (data) => {
    const peer = getPeer(sessionId, role);
    if (peer && peer.readyState === WebSocket.OPEN) {
      peer.send(data.toString());
    } else {
      console.log(`[server] no peer for session ${sessionId}, message dropped`);
    }
  });

  ws.on("close", () => {
    console.log(`[server] ${role} disconnected for session ${sessionId}`);
    const current = sessions.get(sessionId);
    // Only clear the slot if this socket is still the one registered: a stale socket's close firing
    // after a newer reconnect already took the slot must not evict the live connection.
    if (current && current[role] === ws) {
      current[role] = undefined;
      if (!current.extension && !current.web) {
        sessions.delete(sessionId);
      }
    }
  });
}

function getPeer(sessionId: string, role: Role): WebSocket | undefined {
  const pair = sessions.get(sessionId);
  if (!pair) return undefined;
  return role === "extension" ? pair.web : pair.extension;
}

export function generateSessionId(): string {
  return randomUUID();
}