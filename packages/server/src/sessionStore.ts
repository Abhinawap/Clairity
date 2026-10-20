import { db } from "./db";

export function createSessionRecord(sessionId: string) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO sessions (id, created_at, last_seen_at, ext_connected, web_connected)
     VALUES (?, ?, ?, 0, 0)`
  ).run(sessionId, now, now);
}

export function markConnected(sessionId: string, role: "extension" | "web") {
  const column = role === "extension" ? "ext_connected" : "web_connected";
  db.prepare(`UPDATE sessions SET ${column} = 1, last_seen_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    sessionId
  );
}

export function getSession(sessionId: string) {
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
}