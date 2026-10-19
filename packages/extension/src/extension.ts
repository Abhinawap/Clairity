import * as vscode from "vscode";
import { SessionManager } from "./sessionManager";

let sessionManager: SessionManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showWarningMessage("Clairity: open a folder to start a session.");
    return;
  }

  sessionManager = new SessionManager(workspaceRoot);
  sessionManager.start();

  context.subscriptions.push({
    dispose: () => sessionManager?.dispose(),
  });
}

export function deactivate() {
  sessionManager?.dispose();
}