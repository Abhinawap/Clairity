import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { MODEL, type ProposalRequest, streamProposal } from "./promptAssembler";
import { attachSessionBroker, generateSessionId } from "./sessionBroker";
import { createSessionRecord, getSession } from "./sessionStore";

const PORT = Number(process.env.PORT ?? 8787);
const app = new Hono();

app.get("/", (c) => c.text("clairity server running"));

// For checking a deployment: whether the model is configured, never the key itself.
app.get("/health", (c) => c.json({ ok: true, model: MODEL(), tokenFactoryKey: Boolean(process.env.NEBIUS_API_KEY) }));

app.post("/sessions", (c) => {
  const sessionId = generateSessionId();
  createSessionRecord(sessionId);
  const host = c.req.header("host") ?? `localhost:${PORT}`;
  const secure = c.req.header("x-forwarded-proto") === "https";
  return c.json({ sessionId, wsUrl: `${secure ? "wss" : "ws"}://${host}` });
});

app.get("/sessions/:id", (c) => {
  const session = getSession(c.req.param("id"));
  if (!session) {
    return c.json({ error: "session not found" }, 404);
  }
  return c.json(session);
});

// Called by the extension for an intent:request. Streams one JSON object per line: { partial } as the model's
// text arrives, then { proposal } or { error }. The extension relays them to the web app over the session.
app.post("/proposals", async (c) => {
  const req = (await c.req.json()) as ProposalRequest;
  if (!req?.id || !req.prompt || !Array.isArray(req.nodes) || !Array.isArray(req.sources)) {
    return c.json({ error: "expected { id, prompt, scope, nodes, sources }" }, 400);
  }
  c.header("Content-Type", "application/x-ndjson");
  return stream(c, async (out) => {
    const send = (event: unknown) => out.write(`${JSON.stringify(event)}\n`);
    try {
      for await (const event of streamProposal(req)) {
        await send(event);
        if ("proposal" in event && event.dropped.length) {
          console.log(`[server] proposal ${req.id} dropped ${event.dropped.length} Change(s): ${event.dropped.join("; ")}`);
        }
      }
    } catch (err) {
      console.log(`[server] proposal ${req.id} failed: ${(err as Error).message}`);
      await send({ error: (err as Error).message });
    }
  });
});

const server = serve({ fetch: app.fetch, port: PORT, hostname: process.env.HOST ?? "0.0.0.0" }, (info) => {
  console.log(`[server] listening on http://${info.address}:${info.port} (model ${MODEL()}, key ${process.env.NEBIUS_API_KEY ? "set" : "MISSING"})`);
});

attachSessionBroker(server as never);
