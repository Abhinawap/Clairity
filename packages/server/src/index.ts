import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { attachSessionBroker, generateSessionId } from "./sessionBroker";
import { createSessionRecord } from "./sessionStore";
import { getSession } from "./sessionStore";
import { requestProposal } from "./promptAssembler";

const app = new Hono();

app.get("/", (c) => c.text("clairity server running"));

app.post("/sessions", (c) => {
  const sessionId = generateSessionId();
  createSessionRecord(sessionId);
  return c.json({ sessionId, wsUrl: `ws://localhost:8787` });
});

const server = serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
});

app.get("/sessions/:id", (c) => {
  const session = getSession(c.req.param("id"));
  if (!session) {
    return c.json({ error: "session not found" }, 404);
  }
  return c.json(session);
});

app.post("/test-proposal", async (c) => {
  const body = await c.req.json();
  try {
    const proposal = await requestProposal(body);
    return c.json(proposal);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

attachSessionBroker(server as any);