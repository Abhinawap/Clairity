import * as vscode from "vscode";
import { parseComponent } from "./parser/parseComponent";
import type { IRNode } from "shared";

export type GraphPatch = {
  file: string;
  nodes: IRNode[];
  changedNodeIds: string[];
};

type PatchHandler = (patch: GraphPatch) => void;

function flattenIds(nodes: IRNode[], out: Set<string> = new Set()): Set<string> {
  for (const n of nodes) {
    out.add(n.id);
    flattenIds(n.children, out);
  }
  return out;
}

export class SceneGraphWatcher {
  private fsWatcher: vscode.FileSystemWatcher | undefined;
  private cache = new Map<string, IRNode[]>();
  private suppressed = new Set<string>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly onPatch: PatchHandler,
    private readonly output: vscode.OutputChannel
  ) {}

  start(): void {
    this.fsWatcher = vscode.workspace.createFileSystemWatcher("**/*.{tsx,jsx}");
    this.fsWatcher.onDidChange((uri) => this.handleChange(uri.fsPath));
    this.fsWatcher.onDidCreate((uri) => this.handleChange(uri.fsPath));
    this.output.appendLine("[clairity] watcher started for **/*.{tsx,jsx}");
  }

  suppressNextChange(filePath: string): void {
    this.suppressed.add(filePath);
  }

  primeCache(filePath: string, nodes: IRNode[]): void {
    this.cache.set(filePath, nodes);
  }

  private handleChange(filePath: string): void {
    if (this.suppressed.has(filePath)) {
      this.suppressed.delete(filePath);
      return;
    }
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(filePath, setTimeout(() => this.reparse(filePath), 150));
  }

  private reparse(filePath: string): void {
    this.debounceTimers.delete(filePath);
    let nodes: IRNode[];
    try {
      nodes = parseComponent(filePath);
    } catch (err) {
      this.output.appendLine(`[clairity] re-parse failed for ${filePath}: ${(err as Error).message}`);
      return;
    }

    const previousIds = flattenIds(this.cache.get(filePath) ?? []);
    const newIds = flattenIds(nodes);
    const changedNodeIds = [...newIds].filter((id) => !previousIds.has(id));

    this.cache.set(filePath, nodes);
    this.output.appendLine(
      `[clairity] re-parsed ${filePath}: ${nodes.length} root node(s), ${changedNodeIds.length} new/changed id(s)`
    );
    this.onPatch({ file: filePath, nodes, changedNodeIds });
  }

  dispose(): void {
    this.fsWatcher?.dispose();
    this.debounceTimers.forEach((t) => clearTimeout(t));
  }
}