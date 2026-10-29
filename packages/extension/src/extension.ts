import * as vscode from "vscode";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseFile } from "parser";
import type { Change, IRNode } from "shared";
import { SessionManager } from "./sessionManager";
import { SceneGraphWatcher } from "./watcher";
import { applyChanges } from "./parser/diffApplier";

let sessionManager: SessionManager | undefined;
let watcher: SceneGraphWatcher | undefined;

// Next.js App Router entry point, with or without a src/ layout. MVP: one route, not resolved imports.
const ENTRY_CANDIDATES = ["app/page.tsx", "src/app/page.tsx"];

function findEntryFile(workspaceRoot: string): string | undefined {
  return ENTRY_CANDIDATES.map((rel) => join(workspaceRoot, rel)).find((full) => existsSync(full));
}

// ADR 0001: node ids hash the project-relative POSIX path, never the absolute workspace path.
function toProjectRelativePosix(workspaceRoot: string, filePath: string): string {
  return relative(workspaceRoot, filePath).split(sep).join("/");
}

// Parses the entry route and sends graph:full so the web app has something to render on connect.
// The watcher's cache is primed with the same parse so the next file-change patch diffs against it.
function sendInitialGraph(workspaceRoot: string, output: vscode.OutputChannel): void {
  const entryFile = findEntryFile(workspaceRoot);
  if (!entryFile) {
    output.appendLine(`[clairity] no entry route found (looked for ${ENTRY_CANDIDATES.join(", ")}); skipping graph:full`);
    return;
  }
  try {
    const code = readFileSync(entryFile, "utf-8");
    const nodes = parseFile(code, toProjectRelativePosix(workspaceRoot, entryFile));
    watcher?.primeCache(entryFile, nodes);
    sessionManager?.send({ type: "graph:full", nodes });
    output.appendLine(`[clairity] sent graph:full for ${entryFile} (${nodes.length} root node(s))`);
  } catch (err) {
    output.appendLine(`[clairity] initial parse failed for ${entryFile}: ${(err as Error).message}`);
  }
}

// A changed node always patches back out through the normal watcher -> graph:patch path (step 3's
// wiring), so a successful apply here doesn't send anything itself — it just writes the file and
// re-parses. suppressNextChange keeps the filesystem watcher's own event for this write from also
// firing a (redundant) reparse.
function applyNodeChange(nodeId: string, buildChanges: (node: IRNode) => (Change & { id: string })[], output: vscode.OutputChannel): void {
  const found = watcher?.findNode(nodeId);
  if (!found) {
    output.appendLine(`[clairity] edit for unknown nodeId ${nodeId}; dropped`);
    return;
  }
  const changes = buildChanges(found.node);
  if (changes.length === 0) return;

  const nodeLookup = new Map([[nodeId, { line: found.node.source.line, column: found.node.source.column }]]);
  watcher?.suppressNextChange(found.file);
  const result = applyChanges(found.file, nodeLookup, changes);
  if (!result.ok) {
    output.appendLine(`[clairity] edit:apply failed for ${nodeId}: ${result.error}`);
    return;
  }
  watcher?.reparseNow(found.file);
}

function handleIncomingMessage(message: unknown, workspaceRoot: string, output: vscode.OutputChannel): void {
  if (!message || typeof message !== "object" || !("type" in message)) return;
  const msg = message as { type: string } & Record<string, unknown>;

  // Synthesized by the broker, not relayed from the web app (see sessionBroker.ts): a web client
  // connected (or reconnected) after the one-time graph:full was already sent and missed it.
  if (msg.type === "peer:joined" && msg.role === "web") {
    sendInitialGraph(workspaceRoot, output);
    return;
  }

  if (msg.type === "edit:apply" && typeof msg.nodeId === "string" && msg.style && typeof msg.style === "object") {
    const nodeId = msg.nodeId;
    const style = msg.style as Record<string, string>;
    applyNodeChange(
      nodeId,
      (node) =>
        Object.entries(style).map(([property, after], i) => ({
          id: `c_${i}`,
          kind: "style" as const,
          nodeId,
          property,
          before: (node.style as Record<string, string | undefined>)[property],
          after,
        })),
      output
    );
    return;
  }

  if (msg.type === "text:apply" && typeof msg.nodeId === "string" && typeof msg.text === "string") {
    const nodeId = msg.nodeId;
    const text = msg.text;
    applyNodeChange(nodeId, (node) => [{ id: "c_text", kind: "text" as const, nodeId, before: node.text, after: text }], output);
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Clairity: activate() ran!");

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showWarningMessage("Clairity: open a folder to start a session.");
    return;
  }

  const output = vscode.window.createOutputChannel("Clairity");

  sessionManager = new SessionManager(workspaceRoot);
  sessionManager.start(
    () => sendInitialGraph(workspaceRoot, output),
    (message) => handleIncomingMessage(message, workspaceRoot, output)
  );

  watcher = new SceneGraphWatcher(workspaceRoot, (patch) => {
    output.appendLine(`[clairity] patch ready for ${patch.file} (${patch.changedNodeIds.length} ids)`);
    if (patch.changedNodeIds.length === 0) return;
    sessionManager?.send({ type: "graph:patch", changedNodeIds: patch.changedNodeIds, nodes: patch.nodes });
  }, output);
  watcher.start();

  context.subscriptions.push({
    dispose: () => {
      sessionManager?.dispose();
      watcher?.dispose();
    }
  });
}

export function deactivate() {
  sessionManager?.dispose();
  watcher?.dispose();
}