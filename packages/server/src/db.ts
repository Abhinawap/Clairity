import Database from "better-sqlite3";
import { join } from "node:path";

const dbPath = join(process.cwd(), "clairity.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ext_connected INTEGER NOT NULL DEFAULT 0,
    web_connected INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    root_hash TEXT NOT NULL,
    framework TEXT NOT NULL,
    style_source TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    scope TEXT NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    changes_json TEXT NOT NULL,
    accepted_ids_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES proposals(id),
    iterations INTEGER NOT NULL DEFAULT 0,
    final_status TEXT,
    log_json TEXT
  );
`);

console.log("[server] database initialized at", dbPath);