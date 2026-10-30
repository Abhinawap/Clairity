import * as vscode from "vscode";
import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { parseFile } from "parser";
// ADR 0001: node ids hash "<project-relative POSIX path>:<name>:<line>:<column>". parseFile's id
// must match what the (future) data-ir-id Babel plugin computes from the same source, so this must
// always be relative to the project root, forward slashes, never the absolute workspace path.
function toProjectRelativePosix(workspaceRoot, filePath) {
    return relative(workspaceRoot, filePath).split(sep).join("/");
}
function flattenById(nodes, out = new Map()) {
    for (const n of nodes) {
        out.set(n.id, n);
        flattenById(n.children, out);
    }
    return out;
}
// Ids are location-based (see nodeId), so an edit that keeps a node's line/column/name keeps its id too.
// Compare content, not just id presence, or an in-place text/style edit would never be reported as changed.
function nodeContentKey(node) {
    const { children: _children, ...rest } = node;
    return JSON.stringify(rest);
}
export class SceneGraphWatcher {
    workspaceRoot;
    onPatch;
    output;
    fsWatcher;
    cache = new Map();
    suppressed = new Set();
    debounceTimers = new Map();
    constructor(workspaceRoot, onPatch, output) {
        this.workspaceRoot = workspaceRoot;
        this.onPatch = onPatch;
        this.output = output;
    }
    start() {
        this.fsWatcher = vscode.workspace.createFileSystemWatcher("**/*.{tsx,jsx}");
        this.fsWatcher.onDidChange((uri) => this.handleChange(uri.fsPath));
        this.fsWatcher.onDidCreate((uri) => this.handleChange(uri.fsPath));
        this.output.appendLine("[clairity] watcher started for **/*.{tsx,jsx}");
    }
    suppressNextChange(filePath) {
        this.suppressed.add(filePath);
    }
    primeCache(filePath, nodes) {
        this.cache.set(filePath, nodes);
    }
    /** The scene graph last parsed for a file, for a page-scoped Proposal. */
    rootsOf(filePath) {
        return this.cache.get(filePath);
    }
    // Scans every watched file's cached tree for a node id. Used to resolve edit:apply/text:apply,
    // which only carry a nodeId, into the node and file an edit needs.
    findNode(nodeId) {
        for (const [file, nodes] of this.cache) {
            const node = flattenById(nodes).get(nodeId);
            if (node)
                return { file, node };
        }
        return undefined;
    }
    // Re-parses and diffs immediately, bypassing the debounce. Call after writing a file yourself
    // (an applied Edit) once suppressNextChange has been set, so the resulting patch goes out
    // right away instead of waiting on the filesystem watcher's own (suppressed) change event.
    reparseNow(filePath) {
        const pending = this.debounceTimers.get(filePath);
        if (pending)
            clearTimeout(pending);
        this.reparse(filePath);
    }
    handleChange(filePath) {
        if (this.suppressed.has(filePath)) {
            this.suppressed.delete(filePath);
            return;
        }
        const existing = this.debounceTimers.get(filePath);
        if (existing)
            clearTimeout(existing);
        this.debounceTimers.set(filePath, setTimeout(() => this.reparse(filePath), 150));
    }
    reparse(filePath) {
        this.debounceTimers.delete(filePath);
        let nodes;
        try {
            const code = readFileSync(filePath, "utf-8");
            nodes = parseFile(code, toProjectRelativePosix(this.workspaceRoot, filePath));
        }
        catch (err) {
            this.output.appendLine(`[clairity] re-parse failed for ${filePath}: ${err.message}`);
            return;
        }
        const previous = flattenById(this.cache.get(filePath) ?? []);
        const current = flattenById(nodes);
        const changedNodeIds = [];
        const changedNodes = [];
        for (const [id, node] of current) {
            const prev = previous.get(id);
            if (!prev || nodeContentKey(prev) !== nodeContentKey(node)) {
                changedNodeIds.push(id);
                changedNodes.push(node);
            }
        }
        // Ids hash each node's position, so an edit that shifts a node (a longer className before it on the same line)
        // gives it a new id. A patch can't pair those, so the caller sends graph:full instead (ADR 0001).
        const idsChanged = previous.size !== current.size || [...current.keys()].some((id) => !previous.has(id));
        this.cache.set(filePath, nodes);
        this.output.appendLine(`[clairity] re-parsed ${filePath}: ${nodes.length} root node(s), ${changedNodeIds.length} new/changed id(s)`);
        this.onPatch({ file: filePath, nodes: changedNodes, changedNodeIds, roots: nodes, idsChanged });
    }
    dispose() {
        this.fsWatcher?.dispose();
        this.debounceTimers.forEach((t) => clearTimeout(t));
    }
}
//# sourceMappingURL=watcher.js.map