import type { IRNode } from "parser";
import { createStore } from "zustand/vanilla";
import type { ProtocolMessage } from "./protocol";

// The extension side of the protocol: the fake extension, or (later) the broker connection.
export type ExtensionLink = {
  open(onMessage: (message: ProtocolMessage) => void, onConnection: (connection: Connection) => void): void;
};

export type Connection = "connecting" | "connected";

export type SessionState = {
  roots: IRNode[];
  connection: Connection;
};

// Every incoming message goes through here. Messages meant for the extension, and unknown types, change nothing.
function applyMessage(state: SessionState, message: ProtocolMessage): SessionState {
  switch (message.type) {
    case "graph:full":
      return { ...state, roots: message.nodes };
    default:
      return state;
  }
}

export function createSession(link: ExtensionLink) {
  const session = createStore<SessionState>()(() => ({ roots: [], connection: "connecting" }));
  link.open(
    (message) => session.setState((state) => applyMessage(state, message)),
    (connection) => session.setState({ connection }),
  );
  return session;
}
