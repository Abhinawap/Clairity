import * as vscode from "vscode";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { editNodes, type NodeEdit, parseFile } from "parser";
import type { IRNode, Proposal } from "shared";
import { serverUrl, SessionManager } from "./sessionManager";
import { SceneGraphWatcher } from "./watcher";

let sessionManager: SessionManager | undefined;
let watcher: SceneGraphWatcher | undefined;

// The file whose scene graph the editor shows. MVP: one file, not resolved imports. The developer picks it with
// "Clairity: Edit Active File" or the clairity.entryFile setting; otherwise the App Router entry point.
const ENTRY_CANDIDATES = ["app/page.tsx", "src/app/page.tsx"];
let entryFile: string | undefined;

function findEntryFile(workspaceRoot: string): string | undefined {
  const configured = vscode.workspace.getConfiguration("clairity").get<string>("entryFile");
  const candidates = configured ? [configured] : ENTRY_CANDIDATES;
  return candidates.map((rel) => join(workspaceRoot, rel)).find((full) => existsSync(full));
}

// ADR 0001: node ids hash the project-relative POSIX path, never the absolute workspace path.
function toProjectRelativePosix(workspaceRoot: string, filePath: string): string {
  return relative(workspaceRoot, filePath).split(sep).join("/");
}

// A project-relative path from the web app, as an absolute path, only if it stays inside the workspace and is a
// .tsx/.jsx file (project spec, security): the web app never reaches any other file.
function workspaceFile(workspaceRoot: string, file: string): string | undefined {
  const full = resolve(workspaceRoot, file);
  const rel = relative(workspaceRoot, full);
  if (rel.startsWith("..") || isAbsolute(rel) || !/\.(tsx|jsx)$/.test(full)) {return undefined;}
  return existsSync(full) ? full : undefined;
}

// Parses the shown file and sends graph:full. The watcher's cache is primed with the same parse so the next
// file-change patch diffs against it.
function sendGraph(workspaceRoot: string, output: vscode.OutputChannel): void {
  entryFile ??= findEntryFile(workspaceRoot);
  if (!entryFile) {
    output.appendLine(`[clairity] no file to show (looked for ${ENTRY_CANDIDATES.join(", ")}); open one and run "Clairity: Edit Active File"`);
    return;
  }
  try {
    const nodes = parseFile(readFileSync(entryFile, "utf-8"), toProjectRelativePosix(workspaceRoot, entryFile));
    watcher?.primeCache(entryFile, nodes);
    sessionManager?.send({ type: "graph:full", nodes });
    output.appendLine(`[clairity] sent graph:full for ${entryFile} (${nodes.length} root node(s))`);
  } catch (err) {
    output.appendLine(`[clairity] parse failed for ${entryFile}: ${(err as Error).message}`);
  }
}

type Edit = NodeEdit & { node: IRNode };

/**
 * Applies Edits to the files they belong to, all or nothing: every file's new contents are worked out first (by the
 * parser's editNodes) and nothing is written if any Edit fails. Returns the error, or undefined.
 */
function applyEdits(workspaceRoot: string, edits: Edit[]): string | undefined {
  const byFile = new Map<string, Edit[]>();
  for (const e of edits) {
    byFile.set(e.node.source.file, [...(byFile.get(e.node.source.file) ?? []), e]);
  }
  const writes: [string, string][] = [];
  try {
    for (const [file, fileEdits] of byFile) {
      const full = workspaceFile(workspaceRoot, file);
      if (!full) {
        throw new Error(`${file} is not a .tsx/.jsx file in this workspace`);
      }
      writes.push([full, editNodes(readFileSync(full, "utf-8"), file, fileEdits)]);
    }
  } catch (err) {
    return (err as Error).message;
  }
  for (const [full, code] of writes) {
    watcher?.suppressNextChange(full);
    writeFileSync(full, code, "utf-8");
    watcher?.reparseNow(full);
  }
  return undefined;
}

// Proposals this session forwarded to the web app, so proposal:apply can find the Changes it accepted.
const proposals = new Map<string, Proposal>();

// A Proposal's accepted Changes as Edits, or why they can't be applied. Several style Changes on one node become
// one Edit, so their classes are worked out together.
function editsFor(changes: Proposal["changes"]): Edit[] | string {
  const edits: Edit[] = [];
  const styles = new Map<string, Edit>();
  for (const c of changes) {
    if (c.kind !== "style" && c.kind !== "text" && c.kind !== "class") {
      return `${c.kind} Changes are not supported yet`;
    }
    const node = watcher?.findNode(c.nodeId)?.node;
    if (!node) {
      return `${c.nodeId} is no longer in the scene graph; ask again`;
    }
    if (c.kind === "text") {
      edits.push({ node, text: c.after });
    } else if (c.kind === "class") {
      edits.push({ node, classes: { added: c.added, removed: c.removed } });
    } else {
      // padding and margin travel as a JSON box (see the server's toProposal)
      const value = c.property === "padding" || c.property === "margin" ? JSON.parse(c.after) : c.after;
      const existing = styles.get(node.id);
      if (existing) {
        Object.assign(existing.style!, { [c.property]: value });
      } else {
        const edit = { node, style: { [c.property]: value } };
        styles.set(node.id, edit);
        edits.push(edit);
      }
    }
  }
  return edits;
}

// Asks the server for a Proposal and streams it to the web app: the server calls the model on Token Factory, so
// the API key never leaves it. Only the shown nodes and their file's source are sent (project spec, Flow B).
async function requestProposal(
  workspaceRoot: string,
  request: { scope: "node" | "page"; prompt: string; nodeId: string },
  output: vscode.OutputChannel
): Promise<void> {
  const proposalId = `p_${Date.now().toString(36)}`;
  const fail = (message: string) => {
    output.appendLine(`[clairity] proposal failed: ${message}`);
    sessionManager?.send({ type: "intent:error", proposalId, message });
  };
  const target = request.scope === "node" ? watcher?.findNode(request.nodeId) : undefined;
  const file = target?.file ?? entryFile;
  if (!file) {return fail("No file is shown yet");}
  const nodes = target ? [target.node] : (watcher?.rootsOf(file) ?? []);
  const sourceFile = toProjectRelativePosix(workspaceRoot, file);

  let res: Response;
  try {
    res = await fetch(`${serverUrl()}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: proposalId, prompt: request.prompt, scope: request.scope, nodes, sources: [{ file: sourceFile, code: readFileSync(file, "utf-8") }] }),
    });
  } catch (err) {
    return fail(`Could not reach the Clairity server at ${serverUrl()}: ${(err as Error).message}`);
  }
  if (!res.ok || !res.body) {return fail(`Clairity server answered ${res.status}: ${await res.text()}`);}

  // The server streams one JSON object per line: { partial } as text arrives, then { proposal } or { error }.
  const decoder = new TextDecoder();
  let buffered = "";
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffered += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line) {
        continue;
      }
      const event = JSON.parse(line) as { partial?: string; proposal?: Proposal; error?: string };
      if (event.partial) {
        sessionManager?.send({ type: "intent:proposal.partial", proposalId, partial: event.partial });
      }
      if (event.error) {
        return fail(event.error);
      }
      if (event.proposal) {
        proposals.set(event.proposal.id, event.proposal);
        sessionManager?.send({ type: "intent:proposal.done", proposal: event.proposal });
        output.appendLine(`[clairity] proposal ${event.proposal.id}: ${event.proposal.changes.length} Change(s)`);
        return;
      }
    }
  }
  fail("The server closed the stream without a Proposal");
}

function handleIncomingMessage(message: unknown, workspaceRoot: string, output: vscode.OutputChannel): void {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return;
  }
  const msg = message as { type: string } & Record<string, unknown>;

  // Synthesized by the broker, not relayed from the web app (see sessionBroker.ts): a web client
  // connected (or reconnected) after the one-time graph:full was already sent and missed it.
  if (msg.type === "peer:joined" && msg.role === "web") {
    sessionManager?.announce();
    sendGraph(workspaceRoot, output);
    return;
  }

  if ((msg.type === "edit:apply" || msg.type === "text:apply") && typeof msg.nodeId === "string") {
    const node = watcher?.findNode(msg.nodeId)?.node;
    const edit: Edit | undefined =
      !node ? undefined
      : msg.type === "edit:apply" && msg.style && typeof msg.style === "object" ? { node, style: msg.style as Edit["style"] }
      : msg.type === "text:apply" && typeof msg.text === "string" ? { node, text: msg.text }
      : undefined;
    const error = edit ? applyEdits(workspaceRoot, [edit]) : `unknown node ${msg.nodeId}`;
    // ponytail: the protocol has no edit:error yet (spec, open questions), so a refused Edit is only logged
    if (error) {
      output.appendLine(`[clairity] ${msg.type} refused for ${msg.nodeId}: ${error}`);
    }
    return;
  }

  if (msg.type === "source:read" && typeof msg.file === "string") {
    const full = workspaceFile(workspaceRoot, msg.file);
    if (full) {
      sessionManager?.send({ type: "source:content", file: msg.file, content: readFileSync(full, "utf-8") });
    }
    return;
  }

  if (msg.type === "intent:request" && typeof msg.prompt === "string") {
    const scope = msg.scope === "page" ? "page" : "node";
    void requestProposal(workspaceRoot, { scope, prompt: msg.prompt, nodeId: String(msg.nodeId ?? "") }, output);
    return;
  }

  if (msg.type === "proposal:apply" && typeof msg.proposalId === "string" && Array.isArray(msg.acceptedChangeIds)) {
    const proposalId = msg.proposalId;
    const proposal = proposals.get(proposalId);
    const accepted = new Set(msg.acceptedChangeIds as string[]);
    const changes = proposal?.changes.filter((c) => accepted.has(c.id)) ?? [];
    const edits = !proposal ? "This Proposal is no longer known to the extension; ask again" : editsFor(changes);
    const error = typeof edits === "string" ? edits : applyEdits(workspaceRoot, edits);
    if (error) {
      sessionManager?.send({ type: "proposal:error", proposalId, message: error });
      return;
    }
    proposals.delete(proposalId);
    sessionManager?.send({ type: "proposal:applied", proposalId });
  }
}

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    vscode.window.showWarningMessage("Clairity: open a folder to start a session.");
    return;
  }

  const output = vscode.window.createOutputChannel("Clairity");

  const session = new SessionManager(workspaceRoot);
  sessionManager = session;
  // Opens the editor with this session in its address, so the developer never copies a session ID by hand.
  const openEditor = () => {
    output.appendLine(`[clairity] opening ${session.editorUrl}`);
    void vscode.env.openExternal(vscode.Uri.parse(session.editorUrl));
  };
  // Shows the file open in the editor, e.g. the hero component a page imports.
  const editActiveFile = () => {
    const active = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!active || !workspaceFile(workspaceRoot, relative(workspaceRoot, active))) {
      vscode.window.showWarningMessage("Clairity: open a .tsx or .jsx file in this workspace first.");
      return;
    }
    entryFile = active;
    sendGraph(workspaceRoot, output);
  };
  let opened = false;
  session.start(
    () => {
      sendGraph(workspaceRoot, output);
      // Only on the first connect: a reconnect must not open a second tab.
      if (!opened) {
        opened = true;
        openEditor();
      }
    },
    (message) => handleIncomingMessage(message, workspaceRoot, output)
  );

  watcher = new SceneGraphWatcher(workspaceRoot, (patch) => {
    output.appendLine(`[clairity] patch ready for ${patch.file} (${patch.changedNodeIds.length} ids)`);
    // Only the shown file is on the canvas. A shifted id can't be paired, so that change resends the whole graph.
    if (patch.file !== entryFile) {
      return;
    }
    if (patch.idsChanged) {
      sessionManager?.send({ type: "graph:full", nodes: patch.roots });
    } else if (patch.changedNodeIds.length > 0) {
      sessionManager?.send({ type: "graph:patch", changedNodeIds: patch.changedNodeIds, nodes: patch.nodes });
    }
  }, output);
  watcher.start();

  context.subscriptions.push(
    vscode.commands.registerCommand("clairity.openEditor", openEditor),
    vscode.commands.registerCommand("clairity.editActiveFile", editActiveFile),
    {
      dispose: () => {
        sessionManager?.dispose();
        watcher?.dispose();
      },
    }
  );
}

export function deactivate() {
  sessionManager?.dispose();
  watcher?.dispose();
}
