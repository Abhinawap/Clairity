import type { IRNode, Proposal } from "shared";

const TOKEN_FACTORY_URL = "https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    intent: { type: "string" },
    scope: { type: "string", enum: ["node", "page"] },
    changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["style", "text", "class"] },
          nodeId: { type: "string" },
          property: { type: "string" },
          after: { type: "string" },
        },
        required: ["id", "kind", "nodeId"],
      },
    },
    reasoning: { type: "string" },
  },
  required: ["id", "intent", "scope", "changes"],
};

export type AssembleRequest = {
  prompt: string;
  scope: "node" | "page";
  subtree: IRNode;
  componentSource: string;
  styleSource: IRNode["styleSource"];
};

export async function requestProposal(req: AssembleRequest): Promise<Proposal> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    throw new Error("NEBIUS_API_KEY not set");
  }

  const systemPrompt = `You propose UI changes as structured JSON for a ${req.styleSource} styled React/Next.js project.
Only propose changes to properties shown in the provided scene-graph subtree.
Never change props or children you were not shown.`;

  const userPrompt = `Scene graph subtree:\n${JSON.stringify(req.subtree, null, 2)}\n\nComponent source:\n${req.componentSource}\n\nRequest: ${req.prompt}`;

  const res = await fetch(TOKEN_FACTORY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "Proposal", schema: PROPOSAL_SCHEMA, strict: true },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Token Factory request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Token Factory returned no content");
  }

  return JSON.parse(content) as Proposal;
}