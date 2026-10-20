import * as vscode from "vscode";
import { SessionManager } from "./sessionManager";
import { SceneGraphWatcher } from "./watcher";
import { parseComponent } from "./parser/parseComponent";

let sessionManager: SessionManager | undefined;
let watcher: SceneGraphWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Clairity: activate() ran!");
  
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showWarningMessage("Clairity: open a folder to start a session.");
    return;
  }

  const output = vscode.window.createOutputChannel("Clairity");

  sessionManager = new SessionManager(workspaceRoot);
  sessionManager.start();

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