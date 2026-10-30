import type { IRNode } from "parser";
import type { ProtocolMessage } from "./protocol";
import { type ExtensionLink, findNode } from "./session";

// What the fake extension serves: one parsed file, its source and its scene graph.
export type Fixture = { file: string; code: string; roots: IRNode[] };

// In-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code.
export function fakeExtension(fixture: Fixture) {
  const graph = structuredClone(fixture.roots);
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
      switch (message.type) {
        case "source:read":
          // ponytail: the protocol has no error reply for source:read, so a file the fake doesn't hold gets none
          if (message.file === fixture.file) reply({ type: "source:content", file: fixture.file, content: fixture.code });
          return;
        case "edit:apply":
        case "text:apply": {
          const node = findNode(graph, message.nodeId);
          // A refused Edit gets no reply until the extension has an error message for it.
          if (!node?.editable) return;
          if (message.type === "edit:apply") Object.assign(node.style, message.style);
          else node.text = message.text;
          reply({ type: "graph:patch", changedNodeIds: [node.id], nodes: [node] });
          return;
        }
      }
    },
  };
  // emit: send any message to the web app, for tests of what the store ignores.
  // received: every message the web app sent, for tests.
  return { link, received, emit: (message: ProtocolMessage) => deliver(message) };
}
