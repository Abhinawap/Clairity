const apiKey = process.env.NEBIUS_API_KEY;

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    intent: { type: "string" },
    scope: { type: "string", enum: ["node", "page"] },
    changes: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            properties: {
              kind: { const: "style" },
              nodeId: { type: "string" },
              property: { type: "string" },
              after: { type: "string" }
            },
            required: ["kind", "nodeId", "property", "after"]
          }
          // ... other 4 variants would go here for the full test
        ]
      }
    }
  },
  required: ["id", "intent", "scope", "changes"]
};

const res = await fetch("https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "nvidia/nemotron-3-super-120b-a12b",
    messages: [
      { role: "system", content: "You propose UI style changes as structured JSON." },
      { role: "user", content: "Make this button larger and give it rounded corners." }
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "Proposal", schema, strict: true }
    }
  })
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));