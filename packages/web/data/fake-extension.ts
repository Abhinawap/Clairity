import type { IRNode } from "parser";
import type { Proposal } from "./proposal";
import type { IntentRequestMessage, ProtocolMessage } from "./protocol";
import { type ExtensionLink, findNode, flatten } from "./session";

// What the fake extension serves: one parsed file, its source and its scene graph.
export type Fixture = { file: string; code: string; roots: IRNode[] };

// The fake's answer to every request: retitle and recolor the hero's heading. Each Change targets an editable hero Node,
// read from the fake's own scene graph so its ids and before-values match what the store holds.
function cannedProposal(graph: IRNode[], request: IntentRequestMessage, id: string): Proposal {
  const h1 = flatten(graph).find((n) => n.name === "h1" && n.editable);
  const run = h1?.children.find((n) => n.type === "text" && n.editable);
  if (!h1 || !run) throw new Error("the fake's canned Proposal needs the hero fixture's h1 and its first text run");
  return {
    id,
    intent: request.prompt,
    scope: request.scope,
    reasoning: "Darker, larger heading with sharper copy for a more premium feel.",
    changes: [
      { id: `${id}:color`, kind: "style", nodeId: h1.id, property: "color", before: h1.style.color, after: "#0f172a" },
      { id: `${id}:fontSize`, kind: "style", nodeId: h1.id, property: "fontSize", before: h1.style.fontSize, after: "var(--text-6xl)" },
      { id: `${id}:text`, kind: "text", nodeId: run.id, before: run.text, after: "The visual editor you're" },
    ],
  };
}

// In-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code.
export function fakeExtension(fixture: Fixture) {
  const graph = structuredClone(fixture.roots);
  let deliver: (message: ProtocolMessage) => void = () => {};
  const received: ProtocolMessage[] = [];
  let proposals = 0;
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
        case "intent:request": {
          // Streams the canned Proposal as one partial carrying its raw JSON, then done.
          const proposal = cannedProposal(graph, message, `proposal-${++proposals}`);
          reply({ type: "intent:proposal.partial", proposalId: proposal.id, partial: JSON.stringify(proposal) });
          reply({ type: "intent:proposal.done", proposal });
          return;
        }
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
