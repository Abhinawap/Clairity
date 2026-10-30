import { createServer, type Server } from "node:http";
import type { AddressInfo, Socket } from "node:net";
import { afterEach, expect, it } from "vitest";
import { loadHeroFixture } from "../data/hero-fixture";
import type { ProtocolMessage } from "../data/protocol";
import { realExtension } from "../data/real-extension";
import { createSession } from "../data/session";
// The real broker, so these tests also hold the web app to its URL contract (sessionId and role on the WS URL).
import { attachSessionBroker } from "../../server/src/sessionBroker";

const { roots } = loadHeroFixture();
const until = async (check: () => boolean) => {
  for (let i = 0; i < 200 && !check(); i++) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(check()).toBe(true);
};

let server: Server;
let sockets: Socket[] = [];
const closers: (() => void)[] = [];
afterEach(() => {
  for (const close of closers.splice(0)) close();
  for (const s of sockets) s.destroy();
  server?.close();
});

// A broker on a free port. dropAll cuts every connection, like a network blip.
async function broker() {
  server = createServer();
  sockets = [];
  server.on("upgrade", (_req, socket) => sockets.push(socket as Socket));
  attachSessionBroker(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return {
    url: `ws://localhost:${(server.address() as AddressInfo).port}`,
    dropAll: () => sockets.splice(0).forEach((s) => s.destroy()),
  };
}

// The extension's end of the session: it sends graph:full when it connects and again when the broker says the web app
// (re)joined, as packages/extension does.
function extension(url: string, sessionId: string, graph = roots) {
  const received: ProtocolMessage[] = [];
  const connect = () => {
    const ws = new WebSocket(`${url}?sessionId=${sessionId}&role=extension`);
    const full = () => ws.send(JSON.stringify({ type: "graph:full", nodes: graph }));
    ws.addEventListener("open", full);
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.type === "peer:joined") full();
      else received.push(message);
    });
    ws.addEventListener("close", () => setTimeout(() => ws === current && (current = connect()), 20));
    return ws;
  };
  let current = connect();
  closers.push(() => {
    const ws = current;
    current = undefined as unknown as WebSocket;
    ws.close();
  });
  return { received, isOpen: () => current?.readyState === WebSocket.OPEN };
}

it("connects to the broker for its session, holds the extension's scene graph and sends Edits to it", async () => {
  const { url } = await broker();
  const ext = extension(url, "s1");
  await until(ext.isOpen);
  const { link } = realExtension("s1", url);
  closers.push(() => link.close?.());
  const session = createSession(link);
  expect(session.getState().extension).toBe("broker");
  await until(() => session.getState().connection === "connected" && session.getState().roots.length > 0);
  expect(session.getState().roots).toEqual(roots);
  session.getState().readSource("components/hero.tsx");
  await until(() => ext.received.length > 0);
  expect(ext.received).toEqual([{ type: "source:read", file: "components/hero.tsx" }]);
});

it("reports a drop, reconnects, and takes the graph:full resent on reconnect as the scene graph", async () => {
  const { url, dropAll } = await broker();
  const ext = extension(url, "s2");
  await until(ext.isOpen);
  const { link } = realExtension("s2", url);
  closers.push(() => link.close?.());
  const session = createSession(link);
  await until(() => session.getState().roots.length > 0);
  const seen: string[] = [];
  session.subscribe((s, prev) => s.connection !== prev.connection && seen.push(s.connection));
  // The extension's file changed while the web app was away: the resent graph:full must replace the old one.
  session.setState({ roots: [] });
  dropAll();
  await until(() => seen.includes("disconnected"));
  await until(() => session.getState().connection === "connected" && session.getState().roots.length > 0);
  expect(seen).toEqual(["disconnected", "connected"]);
  expect(session.getState().roots).toEqual(roots);
});

it("stops reconnecting once closed", async () => {
  const { url, dropAll } = await broker();
  const { link } = realExtension("s3", url);
  const session = createSession(link);
  await until(() => session.getState().connection === "connected");
  link.close?.();
  dropAll();
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(sockets).toEqual([]);
});
