import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { attachSessionBroker, generateSessionId } from "./sessionBroker";

const app = new Hono();

app.get("/", (c) => c.text("clairity server running"));

app.post("/sessions", (c) => {
  const sessionId = generateSessionId();
  return c.json({ sessionId, wsUrl: `ws://localhost:8787` });
});

const server = serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
});

attachSessionBroker(server as any);