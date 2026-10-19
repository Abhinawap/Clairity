import type { IRNode } from "parser";
import { createStore } from "zustand/vanilla";
import type { EditApplyMessage, ProtocolMessage } from "./protocol";

// The extension side of the protocol: the fake extension, or (later) the broker connection.
export type ExtensionLink = {
  open(onMessage: (message: ProtocolMessage) => void, onConnection: (connection: Connection) => void): void;
  send(message: ProtocolMessage): void;
};

export type Connection = "connecting" | "connected";

export type SessionState = {
  roots: IRNode[];
  connection: Connection;
  selectedId?: string;
  // Selection is local state: it sends nothing to the extension.
  select(id: string): void;
  // Sends the Edit and changes nothing: the store changes when the extension's patch arrives.
  // A Read-only node, or an id not in the scene graph, sends nothing.
  applyEdit(nodeId: string, style: EditApplyMessage["style"]): void;
  // A text Edit on an element: sends its text Node's id (see textRun) and, like applyEdit, changes nothing until the patch.
  // Locked text, or an id not in the scene graph, sends nothing.
  applyText(nodeId: string, text: string): void;
};

const flatten = (nodes: IRNode[]): IRNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);
export const findNode = (nodes: IRNode[], id: string | undefined) => flatten(nodes).find((n) => n.id === id);

// Replaces the Node with this id, children included. An id not in the tree replaces nothing.
// ponytail: copies every Node, so every subscribed component re-renders on a patch; keep untouched subtrees if the layer tree gets slow
const replaceNode = (nodes: IRNode[], id: string, node: IRNode): IRNode[] =>
  nodes.map((n) => (n.id === id ? node : { ...n, children: replaceNode(n.children, id, node) }));

export const selectedNode = (state: SessionState) => findNode(state.roots, state.selectedId);

// The text Node an element's text Edit changes: its only child, when that child is a text Node the parser left editable.
// Anything else, like text split by a <br>, keeps the element's text locked. The element's own Read-only flag locks only its style.
export const textRun = (node: IRNode | undefined) => {
  const [run, ...rest] = node?.children ?? [];
  return run?.type === "text" && run.editable && !rest.length ? run : undefined;
};

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
    default:
      return state;
  }
}

export function createSession(link: ExtensionLink) {
  const session = createStore<SessionState>()((set, get) => ({
    roots: [],
    connection: "connecting",
    select: (id) => set({ selectedId: id }),
    applyEdit(nodeId, style) {
      if (findNode(get().roots, nodeId)?.editable) link.send({ type: "edit:apply", nodeId, style });
    },
    applyText(nodeId, text) {
      const run = textRun(findNode(get().roots, nodeId));
      if (run) link.send({ type: "text:apply", nodeId: run.id, text });
    },
  }));
  link.open(
    (message) => session.setState((state) => applyMessage(state, message)),
    (connection) => session.setState({ connection }),
  );
  return session;
}
