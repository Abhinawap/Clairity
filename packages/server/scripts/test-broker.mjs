import WebSocket from "ws";

const sessionId = "test-session-123";
const role = process.argv[2]; // "extension" or "web"

const ws = new WebSocket(`ws://localhost:8787?sessionId=${sessionId}&role=${role}`);

ws.on("open", () => {
  console.log(`[${role}] connected`);
  if (role === "extension") {
    setTimeout(() => ws.send("hello from extension"), 1000);
  }
});

ws.on("message", (data) => {
  console.log(`[${role}] received:`, data.toString());
});