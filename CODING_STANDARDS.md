# Coding standards

Read during review. Each rule is a judgement call no linter can make.

## One implementation per shared contract

Every rule that two places must agree on lives in one exported function, and each consumer imports it. Today these live in `packages/parser/src/parse.ts`:

- **Node id**: `nodeId` / `elementId`. Consumers: `parseFile`, `editClasses`, and the coming `data-ir-id` Babel plugin, which must produce the same id ([ADR 0001](docs/adr/0001-node-id-from-source-location.md)).
- **Read-only rule**: `readOnlyReason`. `parseFile` marks the node, and `editClasses` refuses it, from the same answer.
- **Static className reading**: `classNameAttr` / `classNameLiteral`.

Flag any diff that recomputes one of these, or adds a new parser/transformer rule in one place only. That includes copying the logic into the Babel plugin instead of importing it.

## Actions take what the caller holds

A data-layer action takes the values its UI caller already has: the selected Node's id, which a canvas click gives as an element or component id ([ADR 0001](docs/adr/0001-node-id-from-source-location.md): `data-ir-id` sits on JSX elements, never on text runs). The action resolves anything finer, such as an element's text Node, through one exported helper. Flag an action whose parameters a component could only get by searching the tree.
