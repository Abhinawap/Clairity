import type { IRNode } from "parser";
import type { ProtocolMessage } from "./protocol";
import type { ExtensionLink } from "./session";

// In-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code.
export function fakeExtension(roots: IRNode[]) {
  const graph = structuredClone(roots);
  let deliver: (message: ProtocolMessage) => void = () => {};
  const link: ExtensionLink = {
    open(onMessage, onConnection) {
      // Cloned like a real wire would, so the store never shares objects with the fake's copy.
      deliver = (message) => onMessage(structuredClone(message));
      onConnection("connected");
      deliver({ type: "graph:full", nodes: graph });
    },
  };
  // emit: send any message to the web app, for tests of what the store ignores.
  return { link, emit: (message: ProtocolMessage) => deliver(message) };
}
