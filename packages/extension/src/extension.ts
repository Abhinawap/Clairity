import * as vscode from "vscode";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SessionManager } from "./sessionManager";
import { SceneGraphWatcher } from "./watcher";
import { parseComponent } from "./parser/parseComponent";

let sessionManager: SessionManager | undefined;
let watcher: SceneGraphWatcher | undefined;

// Next.js App Router entry point, with or without a src/ layout. MVP: one route, not resolved imports.
const ENTRY_CANDIDATES = ["app/page.tsx", "src/app/page.tsx"];

function findEntryFile(workspaceRoot: string): string | undefined {
  return ENTRY_CANDIDATES.map((rel) => join(workspaceRoot, rel)).find((full) => existsSync(full));
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
    const nodes = parseComponent(entryFile);
    watcher?.primeCache(entryFile, nodes);
    sessionManager?.send({ type: "graph:full", nodes });
    output.appendLine(`[clairity] sent graph:full for ${entryFile} (${nodes.length} root node(s))`);
  } catch (err) {
    output.appendLine(`[clairity] initial parse failed for ${entryFile}: ${(err as Error).message}`);
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
  sessionManager.start(() => sendInitialGraph(workspaceRoot, output));

  watcher = new SceneGraphWatcher((patch) => {
    output.appendLine(`[clairity] patch ready for ${patch.file} (${patch.changedNodeIds.length} ids)`);
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