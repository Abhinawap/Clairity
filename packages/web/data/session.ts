import type { IRNode } from "parser";
import { createStore } from "zustand/vanilla";
import type { Proposal } from "./proposal";
import type { EditApplyMessage, IntentRequestMessage, ProtocolMessage } from "./protocol";

// The extension side of the protocol: the fake extension, or (later) the broker connection.
export type ExtensionLink = {
  open(onMessage: (message: ProtocolMessage) => void, onConnection: (connection: Connection) => void): void;
  send(message: ProtocolMessage): void;
  // Optional: nothing to close for the fake. The real link closes its socket, so a reload or a
  // React Strict Mode dev remount doesn't leave an orphaned connection behind.
  close?(): void;
};

export type Connection = "connecting" | "connected";

export type SessionState = {
  roots: IRNode[];
  connection: Connection;
  selectedId?: string;
  // Source files by path, as the extension last sent them (see readSource).
  sources: Record<string, string>;
  // The raw text of a Proposal still streaming, so the AI panel can show progress; empty when none is.
  streaming: string;
  // The finished Proposal waiting for the developer to accept or reject its Changes.
  proposal?: Proposal;
  // The extension's message when it refused to apply a Proposal; the Proposal stays so the panel can show both.
  lastError?: string;
  // Selection is local state: it sends nothing to the extension.
  select(id: string): void;
  // Sends the Edit and changes nothing: the store changes when the extension's patch arrives.
  // A Read-only node, or an id not in the scene graph, sends nothing.
  applyEdit(nodeId: string, style: EditApplyMessage["style"]): void;
  // A text Edit on one text run (see textRuns): like applyEdit, it sends the run's id and changes nothing until the patch.
  // An id that is not a text run, a Read-only text run, or an id not in the scene graph sends nothing.
  // An element's Read-only flag covers only its style, so its text runs stay editable.
  applyText(runId: string, text: string): void;
  // Asks the extension for a file, such as the selected Node's `source.file`; its contents land in `sources` under that path.
  readSource(file: string): void;
  // Asks the model for a Proposal, scoped to one Node (the selected Node's id) or to the whole page.
  // Like every action it changes nothing: streaming text and the Proposal arrive as the extension's replies.
  requestProposal(request: { scope: IntentRequestMessage["scope"]; prompt: string; nodeId?: string }): void;
  // Applies the pending Proposal's accepted Changes: all of their ids, none (reject all) or a chosen subset.
  // It changes nothing itself: the extension's graph:patch and proposal:applied clear the Proposal. No pending Proposal sends nothing.
  applyProposal(acceptedChangeIds: string[]): void;
};

// Every Node in the tree, parents before their children.
export const flatten = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);
export const findNode = (nodes: IRNode[], id: string | undefined) => flatten(nodes).find((n) => n.id === id);

// Replaces the Node with this id, children included. An id not in the tree replaces nothing.
// ponytail: copies every Node, so every subscribed component re-renders on a patch; keep untouched subtrees if the layer tree gets slow
const replaceNode = (nodes: IRNode[], id: string, node: IRNode): IRNode[] =>
  nodes.map((n) => (n.id === id ? node : { ...n, children: replaceNode(n.children, id, node) }));

export const selectedNode = (state: SessionState) => findNode(state.roots, state.selectedId);

// A Node's own text runs, one inspector field each: its direct children, or the run itself when a text run is selected.
export const textRuns = (node: IRNode | undefined) =>
  node?.type === "text" ? [node] : (node?.children ?? []).filter((n) => n.type === "text");

// Every incoming message goes through here. Messages meant for the extension, and unknown types, change nothing.
function applyMessage(state: SessionState, message: ProtocolMessage): SessionState {
  switch (message.type) {
    case "graph:full":
      return { ...state, roots: message.nodes };
    case "graph:patch":
      return {
        ...state,
        roots: message.changedNodeIds.reduce((roots, oldId, i) => replaceNode(roots, oldId, message.nodes[i]), state.roots),
      };
    case "source:content":
      return { ...state, sources: { ...state.sources, [message.file]: message.content } };
    case "intent:proposal.partial":
      return { ...state, streaming: state.streaming + message.partial };
    case "intent:proposal.done":
      return { ...state, proposal: message.proposal, streaming: "", lastError: undefined };
    // A reply about a Proposal that is no longer pending changes nothing.
    case "proposal:applied":
      return state.proposal?.id === message.proposalId ? { ...state, proposal: undefined, lastError: undefined } : state;
    case "proposal:error":
      return state.proposal?.id === message.proposalId ? { ...state, lastError: message.message } : state;
    default:
      return state;
  }
}

export function createSession(link: ExtensionLink) {
  const session = createStore<SessionState>()((set, get) => ({
    roots: [],
    connection: "connecting",
    sources: {},
    streaming: "",
    select: (id) => set({ selectedId: id }),
    applyEdit(nodeId, style) {
      if (findNode(get().roots, nodeId)?.editable) link.send({ type: "edit:apply", nodeId, style });
    },
    applyText(runId, text) {
      const run = findNode(get().roots, runId);
      if (run?.type === "text" && run.editable) link.send({ type: "text:apply", nodeId: runId, text });
    },
    readSource: (file) => link.send({ type: "source:read", file }),
    // ponytail: nodeId is required on the wire, so page scope sends ""; asked Varutieru whether it becomes optional (#12)
    requestProposal: ({ scope, prompt, nodeId = "" }) =>
      link.send({ type: "intent:request", scope, prompt, nodeId: scope === "page" ? "" : nodeId }),
    applyProposal(acceptedChangeIds) {
      const { proposal } = get();
      if (proposal) link.send({ type: "proposal:apply", proposalId: proposal.id, acceptedChangeIds });
    },
  }));
  link.open(
    (message) => session.setState((state) => applyMessage(state, message)),
    (connection) => session.setState({ connection }),
  );
  return session;
}
