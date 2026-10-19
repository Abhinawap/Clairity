// ponytail: copy of packages/shared/src/proposal.ts from feat/scaffold-monorepo; import from "shared" once that branch merges
export type StyleChange = {
  kind: "style";
  nodeId: string;
  property: string;   // e.g. "backgroundColor", "width"
  before: string | undefined;
  after: string;
};

export type TextChange = {
  kind: "text";
  nodeId: string;
  before: string | undefined;
  after: string;
};

export type ClassChange = {
  kind: "class";
  nodeId: string;
  added: string[];
  removed: string[];
};

export type InsertChange = {
  kind: "insert";
  parentNodeId: string;
  index: number;
  jsx: string;         // raw JSX snippet to insert
};

export type SourceChange = {
  kind: "source";
  file: string;
  before: string;
  after: string;
  description: string; // human-readable summary, shown in diff review
};

export type Change =
  | StyleChange
  | TextChange
  | ClassChange
  | InsertChange
  | SourceChange;

// FULL PROPOSAL

export type Proposal = {
  id: string;
  intent: string;        // the original prompt, echoed back
  scope: "node" | "page";
  changes: (Change & { id: string })[]; // each change gets its own id for accept/reject
  reasoning?: string;     // short model explanation, shown in the AI panel
};
