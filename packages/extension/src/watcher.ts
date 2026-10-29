import * as vscode from "vscode";
import { parseComponent } from "./parser/parseComponent";
import type { IRNode } from "shared";

export type GraphPatch = {
  file: string;
  nodes: IRNode[];
  changedNodeIds: string[];
};

type PatchHandler = (patch: GraphPatch) => void;

function flattenById(nodes: IRNode[], out: Map<string, IRNode> = new Map()): Map<string, IRNode> {
  for (const n of nodes) {
    out.set(n.id, n);
    flattenById(n.children, out);
  }
  return out;
}

// Ids are location-based (see nodeId), so an edit that keeps a node's line/column/name keeps its id too.
// Compare content, not just id presence, or an in-place text/style edit would never be reported as changed.
function nodeContentKey(node: IRNode): string {
  const { children: _children, ...rest } = node;
  return JSON.stringify(rest);
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

  // Scans every watched file's cached tree for a node id. Used to resolve edit:apply/text:apply,
  // which only carry a nodeId, into the file + location diffApplier needs.
  findNode(nodeId: string): { file: string; node: IRNode } | undefined {
    for (const [file, nodes] of this.cache) {
      const node = flattenById(nodes).get(nodeId);
      if (node) return { file, node };
    }
    return undefined;
  }

  // Re-parses and diffs immediately, bypassing the debounce. Call after writing a file yourself
  // (e.g. from diffApplier) once suppressNextChange has been set, so the resulting patch goes out
  // right away instead of waiting on the filesystem watcher's own (suppressed) change event.
  reparseNow(filePath: string): void {
    const pending = this.debounceTimers.get(filePath);
    if (pending) clearTimeout(pending);
    this.reparse(filePath);
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

    const previous = flattenById(this.cache.get(filePath) ?? []);
    const current = flattenById(nodes);
    const changedNodeIds: string[] = [];
    const changedNodes: IRNode[] = [];
    for (const [id, node] of current) {
      const prev = previous.get(id);
      if (!prev || nodeContentKey(prev) !== nodeContentKey(node)) {
        changedNodeIds.push(id);
        changedNodes.push(node);
      }
    }

    this.cache.set(filePath, nodes);
    this.output.appendLine(
      `[clairity] re-parsed ${filePath}: ${nodes.length} root node(s), ${changedNodeIds.length} new/changed id(s)`
    );
    this.onPatch({ file: filePath, nodes: changedNodes, changedNodeIds });
  }

  dispose(): void {
    this.fsWatcher?.dispose();
    this.debounceTimers.forEach((t) => clearTimeout(t));
  }
}