import type { IRNode } from "parser";
import type { ProtocolMessage } from "./protocol";
import { type ExtensionLink, findNode } from "./session";

// In-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code.
export function fakeExtension(roots: IRNode[]) {
  const graph = structuredClone(roots);
  let deliver: (message: ProtocolMessage) => void = () => {};
  const received: ProtocolMessage[] = [];
  // Replies arrive on a later tick, like a real wire, so the store keeps the confirmed value until then.
  const reply = (message: ProtocolMessage) => {
    const sent = structuredClone(message);
    setTimeout(() => deliver(sent));
  };
  const link: ExtensionLink = {
    open(onMessage, onConnection) {
      // Cloned like a real wire would, so the store never shares objects with the fake's copy.
      deliver = (message) => onMessage(structuredClone(message));
      onConnection("connected");
      deliver({ type: "graph:full", nodes: graph });
    },
    send(message) {
      received.push(structuredClone(message));
      if (message.type !== "edit:apply" && message.type !== "text:apply") return;
      const node = findNode(graph, message.nodeId);
      // A refused Edit gets no reply until the extension has an error message for it.
      if (!node?.editable) return;
      if (message.type === "edit:apply") Object.assign(node.style, message.style);
      else node.text = message.text;
      reply({ type: "graph:patch", changedNodeIds: [node.id], nodes: [node] });
    },
  };
  // emit: send any message to the web app, for tests of what the store ignores.
  // received: every message the web app sent, for tests.
  return { link, received, emit: (message: ProtocolMessage) => deliver(message) };
}
