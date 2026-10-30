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

// Why the fake refuses an accepted Change, or undefined when it can apply it. Kinds other than style and text are the
// real extension's job, so the fake accepts and skips them.
function refusal(graph: IRNode[], change: Proposal["changes"][number] | undefined) {
  if (!change) return "no such Change in this Proposal";
  if (change.kind !== "style" && change.kind !== "text") return undefined;
  const node = findNode(graph, change.nodeId);
  if (!node) return `${change.nodeId} is not in the scene graph`;
  if (!node.editable) return `${node.name} is Read-only: ${node.reason}`;
  if (change.kind === "text" && node.type !== "text") return `${node.name} is not a text run`;
  return undefined;
}

// In-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code.
// propose: rewrites the canned Proposal before it is sent, so a test can get one the fake will refuse to apply.
export function fakeExtension(fixture: Fixture, { propose = (proposal: Proposal) => proposal } = {}) {
  const graph = structuredClone(fixture.roots);
  let deliver: (message: ProtocolMessage) => void = () => {};
  const received: ProtocolMessage[] = [];
  let proposals = 0;
  const sentProposals = new Map<string, Proposal>();
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
          const proposal = propose(cannedProposal(graph, message, `proposal-${++proposals}`));
          sentProposals.set(proposal.id, proposal);
          reply({ type: "intent:proposal.partial", proposalId: proposal.id, partial: JSON.stringify(proposal) });
          reply({ type: "intent:proposal.done", proposal });
          return;
        }
        case "proposal:apply": {
          // All or nothing, like the real extension per file: one refused Change applies none of them.
          const changes = message.acceptedChangeIds.map((id) => sentProposals.get(message.proposalId)?.changes.find((c) => c.id === id));
          const why = changes.map((c) => refusal(graph, c)).find(Boolean);
          if (why) return reply({ type: "proposal:error", proposalId: message.proposalId, message: why });
          const changed = new Map<string, IRNode>();
          for (const c of changes) {
            if (c?.kind !== "style" && c?.kind !== "text") continue;
            const node = findNode(graph, c.nodeId)!;
            if (c.kind === "style") Object.assign(node.style, { [c.property]: c.after });
            else node.text = c.after;
            changed.set(node.id, node);
          }
          // ponytail: ids stay put because the fake never rewrites code; the real extension's patch pairs old ids with new ones
          if (changed.size) reply({ type: "graph:patch", changedNodeIds: [...changed.keys()], nodes: [...changed.values()] });
          reply({ type: "proposal:applied", proposalId: message.proposalId });
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
