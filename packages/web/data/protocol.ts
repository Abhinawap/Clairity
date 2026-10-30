// ponytail: copy of packages/shared/src/protocol.ts from feat/scaffold-monorepo; import from "shared" once that branch merges
import type { IRNode } from "parser";
import type { Proposal } from "./proposal";

// Component Pass: Extension -> Web

export type SessionReadyMessage = {
  type: "session:ready";
  sessionId: string;
  devServerUrl: string;
};

export type GraphFullMessage = {
  type: "graph:full";
  nodes: IRNode[];
};

export type GraphPatchMessage = {
  type: "graph:patch";
  changedNodeIds: string[];
  nodes: IRNode[]; // updated nodes only
};

export type SourceContentMessage = {
  type: "source:content";
  file: string;
  content: string;
};

export type ProposalAppliedMessage = {
  type: "proposal:applied";
  proposalId: string;
};

export type ProposalErrorMessage = {
  type: "proposal:error";
  proposalId: string;
  message: string;
};

export type AgentStepMessage = {
  type: "agent:step";
  step: number;
  description: string;
  status: "running" | "ok" | "error";
};

// --- Web → Extension (via Server) ---

export type EditApplyMessage = {
  type: "edit:apply";
  nodeId: string;
  style: Partial<IRNode["style"]>;
};

export type TextApplyMessage = {
  type: "text:apply";
  nodeId: string;
  text: string;
};

export type SourceReadMessage = {
  type: "source:read";
  file: string;
};

export type IntentRequestMessage = {
  type: "intent:request";
  nodeId: string;
  scope: "node" | "page";
  prompt: string;
};

export type ProposalApplyMessage = {
  type: "proposal:apply";
  proposalId: string;
  acceptedChangeIds: string[];
};

export type AgentStopMessage = {
  type: "agent:stop";
};

// --- Backend-originated (AI results) ---

export type IntentProposalPartialMessage = {
  type: "intent:proposal.partial";
  proposalId: string;
  partial: string; // streamed raw text/JSON chunk
};

// The Proposal could not be made (the model or the server failed); nothing was proposed.
export type IntentErrorMessage = {
  type: "intent:error";
  proposalId: string;
  message: string;
};

export type IntentProposalDoneMessage = {
  type: "intent:proposal.done";
  proposal: Proposal;
};

// --- Union of every message the socket can carry ---

export type ProtocolMessage =
  | SessionReadyMessage
  | GraphFullMessage
  | GraphPatchMessage
  | SourceContentMessage
  | ProposalAppliedMessage
  | ProposalErrorMessage
  | AgentStepMessage
  | EditApplyMessage
  | TextApplyMessage
  | SourceReadMessage
  | IntentRequestMessage
  | ProposalApplyMessage
  | AgentStopMessage
  | IntentProposalPartialMessage
  | IntentProposalDoneMessage
  | IntentErrorMessage;
