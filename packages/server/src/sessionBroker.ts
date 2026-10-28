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
  pair[role] = ws;
  sessions.set(sessionId, pair);

  console.log(`[server] ${role} connected for session ${sessionId}`);

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
    if (current) {
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