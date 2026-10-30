# Feature Spec: Web app data layer

**Source:** [`project-spec.md`](./project-spec.md) (web app store, WebSocket protocol, Flow A) and the 2026-10-19 design interview
**Status:** Draft (2026-10-19)
**Owner:** Abhinawap. The frontend partner builds the UI on top; Varutieru owns the extension and the shared types; the broker has its own owner.

## Problem Statement

The web app has two halves: what the developer sees (canvas, layer tree, inspector, AI panel, Code view) and the data underneath it (the scene graph, the selection, pending Proposals, the connection to the extension). Nobody has started the web app, the broker does not exist yet, and the shared message types sit on an unmerged branch. If the UI is built first, it has nothing real to render and every component invents its own idea of state. If the data layer waits for the broker and the extension, the frontend partner waits too, and submissions close on 2026-10-30.

## Solution

A data layer inside the web app that owns the scene graph, the selection and everything that crosses the wire, behind a small set of actions the UI calls. It runs against a fake extension from day one, so the frontend partner can build a real layer tree and inspector before the broker or the extension exist. When the broker lands, the same data layer connects to it instead, chosen by whether the web app's address carries a session ID. The UI only ever reads state and calls actions; it never sends a message itself.

## User Stories

1. As the frontend partner, I want the web app package to exist with a working dev server, so that I can start building components on the same app.
2. As the frontend partner, I want to open the web app without any session ID and see a real scene graph, so that I can build the layer tree before the broker exists.
3. As the frontend partner, I want the scene graph to come from a real parsed component, so that my layer tree handles real nesting, text runs, component Nodes and Read-only nodes.
4. As the frontend partner, I want to read the scene graph from the store, so that I never parse messages in a component.
5. As the frontend partner, I want to select a Node by id, so that clicking the canvas or the layer tree highlights the same Node in both.
6. As the frontend partner, I want the selected Node available from the store, so that the inspector can show its properties without searching the tree itself.
7. As the frontend partner, I want one action to apply an Edit to a Node's style, so that every inspector control and canvas handle goes through the same path.
8. As the frontend partner, I want an Edit to carry several style properties at once, so that one drag can change width and height together.
9. As the frontend partner, I want the store to show only values the extension has confirmed, so that the inspector never shows a value that is not in the source file.
10. As the frontend partner, I want an Edit on a Read-only node to do nothing, so that a stray control cannot try to rewrite code the tool cannot edit safely.
11. As the frontend partner, I want each Read-only node's reason in the store, so that the inspector can explain why it is Read-only.
12. As the frontend partner, I want the selection to stay on a Node after its Edit is confirmed, so that the inspector does not lose its place mid-adjustment.
13. As the frontend partner, I want to change any of the selected Node's text runs with one action, so that text editing in the inspector works the same way as style Edits.
14. As the frontend partner, I want to ask for a Node's source file and find its contents in the store, so that Code view can show and highlight the right lines.
15. As the frontend partner, I want to send a prompt scoped to the selected Node or to the whole page, so that the AI panel's scope selector has one action behind it.
16. As the frontend partner, I want the text of a streaming Proposal in the store as it arrives, so that the AI panel shows progress instead of a spinner.
17. As the frontend partner, I want the finished Proposal and its Changes in the store, so that I can render the diff list.
18. As the frontend partner, I want to accept all, none, or a chosen subset of a Proposal's Changes with one action, so that accept-all, reject-all and per-Change toggles share one path.
19. As the frontend partner, I want the pending Proposal cleared once its Changes are applied, so that the AI panel resets on its own.
20. As the frontend partner, I want the extension's error message in the store when a Proposal fails to apply, so that I can show it next to the Proposal.
21. As the frontend partner, I want the connection state in the store, so that I can show when the web app is not connected to the extension.
22. As a developer using Clairity, I want the web app to connect to my session when the extension opens it, so that I never copy a session ID by hand.
23. As a developer using Clairity, I want my selection to survive when the scene graph is re-parsed, so that editing the file in VS Code does not throw me out of the inspector.
24. As a developer using Clairity, I want the web app to recover after a dropped connection, so that a network blip does not end my session.
25. As a developer using Clairity, I want an Edit that the extension refuses to leave my page unchanged, so that the canvas never shows something my code does not contain.
26. As the data layer's author, I want every rule for incoming messages in one plain function, so that I can test them without React or a browser.
27. As the data layer's author, I want tests that drive the public actions against the fake extension, so that I can restructure internals without rewriting tests.
28. As the data layer's author, I want the fake extension to follow the same patch rules as the real one, so that passing tests mean something when the real extension arrives.
29. As the data layer's author, I want CI to run the web app's tests and type-check on every PR, so that a broken store never reaches main.
30. As the extension owner, I want the web app to speak exactly the message types in the shared package, so that I don't maintain a second dialect.
31. As the extension owner, I want additions and removals of Nodes handled by resending the full scene graph, so that I don't have to design a removal format now.
32. As the broker owner, I want the web app to choose fake or real from the session ID in its address alone, so that the handshake only needs a URL and a session ID.
33. As the team, I want the licensed demo project kept out of the repo, so that the public repo at the deadline contains nothing we may not redistribute.

## Implementation Decisions

**Package and ownership**

- The web app is a new Next.js package (current stable, App Router, TypeScript, Tailwind: the create-next-app defaults match the project spec). Abhinawap creates it and tells the frontend partner.
- The data layer lives in one folder inside the web app. Components belong to the frontend partner and only read state and call actions.
- The package defines `test` and `check-types` scripts, so the existing CI workflow runs them on every PR.

**Message contract**

- The data layer speaks Varutieru's message types from `feat/scaffold-monorepo` (flat messages, `edit:apply` carrying a partial style object), not the envelope in the project spec's protocol table, because the extension already speaks them.
- Until the shared package merges, the web app keeps a temporary copy of the message and Proposal types, marked with a `ponytail:` comment naming the branch, the same way the parser keeps its copy of the scene-graph types. Scene-graph types come from the parser package; there is no third copy. When the shared package merges, the copy is deleted and imports point at it.

**Public interface of the data layer**

- A session is created against an extension link: the fake extension, or (later) the broker connection. Everything below is the same for both.
- State the UI reads: the scene graph roots, the selected Node id, the connection state, source files by path, the pending Proposal, the text of a Proposal still streaming, and the last error from the extension.
- Actions the UI calls: select a Node; apply an Edit (Node id plus a partial style); change a text run (its id plus the new text); read a source file; request a Proposal (scope, prompt, optional Node id); apply a Proposal (the accepted Change ids).
- Selection is local state. Selecting sends nothing to the extension.

**Store**

- Zustand, as the project spec says. Every incoming message goes through one pure function from (state, message) to new state.
- Only confirmed state: actions send messages and change nothing. The store changes when the extension's reply arrives. An inspector control keeps its own draft value while the user types; that is a UI concern.
- An Edit on a Node whose `editable` flag is false, or on an id not in the scene graph, sends nothing. The data layer reads the parser's flag and never works out the Read-only rule itself (CODING_STANDARDS: one implementation per shared contract).

**Text Edits** (decided 2026-10-19; per-run editing replaced the one-run rule the same day)

- Every text run is edited on its own. The inspector shows one field for each of the selected Node's own text runs, its direct children: the hero's `h1` shows "The website builder you're" and "looking for", the `a` shows "Start", and the `span` inside it shows "->". A canvas click selects the innermost element under the pointer, so the text the developer clicked is always one of the fields. When the layer tree selects a text run itself, the inspector edits that run.
- One exported helper lists a Node's own text runs. The inspector reads it and the action takes one of its ids, so no component searches the tree.
- A text Edit sends `text:apply` with the text run's id, so the message the extension receives does not change. An id that is not a text run, a text run the parser marked Read-only, or an id not in the scene graph sends nothing.
- An element's Read-only flag covers its style, not its text runs: the hero's spread-props button keeps "Learn More" editable. A component usage's text runs are edited the same way, like the "Save" in `<Button>Save</Button>`.

**Rules for incoming messages**

- `graph:full` replaces the whole scene graph. The selection survives only if its id still exists.
- `graph:patch`: `changedNodeIds[i]` is the old id of `nodes[i]`, the Node's new data. Each pair replaces the Node with that old id, children included, and moves the selection to the new id if it was on the old one. A pair whose old id is no longer in the tree (for example, a child already replaced along with its parent) still moves the selection but replaces nothing.
- Additions and removals have nothing to pair, so the extension sends `graph:full` for them (ADR 0001, agreed 2026-10-19, not yet tested in the extension).
- `source:content` stores the file's contents by path.
- `intent:proposal.partial` appends its raw text to the streaming text. `intent:proposal.done` sets the pending Proposal and clears the streaming text.
- `proposal:applied` clears the pending Proposal. `proposal:error` stores the extension's message and keeps the Proposal.
- Messages meant for the extension, and unknown types, are ignored.

**Fake extension**

- An in-memory stand-in for the extension side of the protocol. It holds its own copy of the scene graph and never rewrites code: turning a style value into a Tailwind class is the extension's transformer's job.
- On start it sends `graph:full` with the scene graph of the parser's own hero fixture. It never uses the demo project, whose licence keeps it out of the repo.
- On `edit:apply` it merges the style into its copy of the Node and replies with a one-pair `graph:patch`. On `text:apply` it does the same for the text. On `source:read` it replies with the fixture's source. On `intent:request` it streams a canned Proposal as one partial and one done. On `proposal:apply` it applies the accepted style and text Changes, replies with `graph:patch`, then `proposal:applied`.
- In the browser, the Next.js server parses the fixture in Node and hands the scene graph and source to the page, so Babel is never bundled for the browser. Tests call the parser directly.

**Choosing fake or real**

- An address without a session ID runs the fake extension; that is how the frontend partner works. An address with `?session=<id>`, which the extension opens, connects to the broker. Until the broker connection exists, only the fake runs.
- The broker connection reads the session ID from the address, reports the connection state (`connecting`, `connected`, or `disconnected` while it retries), reconnects after a drop, and takes the `graph:full` the extension resends as the new scene graph (project spec, failure handling).
- Decided 2026-10-30 with the broker as built (`packages/server/src/sessionBroker.ts`): both sides connect to the broker's WebSocket with `?sessionId=<id>&role=extension|web`, and the broker pairs them. When the web app joins a session whose extension is already connected, the broker sends the extension `peer:joined` and the extension resends `graph:full`; the extension also resends it whenever its own socket reconnects.
- The extension opens `<webAppUrl>/editor?session=<id>` on its first connect and offers **Clairity: Open Editor** to reopen it. The broker and web app addresses are the extension settings `clairity.brokerUrl` (default `ws://localhost:8787`) and `clairity.webAppUrl` (default `http://localhost:3100`), and the web app's `NEXT_PUBLIC_BROKER_URL`. The web app runs on port 3100, so it never takes the port of the project's own `next dev`.

## Testing Decisions

- **One seam:** the data layer's public interface, with the fake extension behind it. A test creates a session against the fake, calls actions, and asserts on two things only: what the store holds and which messages the fake received. The message-handling function is tested through that route, not on its own.
- **A good test** checks behaviour the UI or the extension can observe (state, messages on the wire) and survives a rewrite of the internals. No React, no browser, no timers beyond what the fake needs.
- **Fixture:** the parser's hero fixture, parsed in the test, so the scene graph is real and stays in step with the parser.
- **Prior art:** the parser's Vitest suites, especially matching against a hand-written expected tree and adding a test that fails before each fix.
- **Not unit-tested:** the server step that parses the fixture for the browser is thin glue; it is checked by loading the app without a session ID and seeing the scene graph.
- **CI:** the package's `test` and `check-types` run in the existing workflow on every PR.

## Out of Scope

- All components: canvas, overlay, layer tree, inspector, AI panel, Code view rendering (frontend partner).
- The broker and its handshake, the extension, and the transformer's mapping from style values to Tailwind classes.
- Showing an Edit before the extension confirms it.
- The agent's build-fix-render loop and its log (v2 stretch goal).
- Editing in Code view, persistence, proposal history, more than one user.

## Further Notes

**Open questions**

- **Streaming Proposals:** `intent:proposal.partial` carries raw text, not Changes. The store keeps the raw text; whether the AI panel shows Changes before `done` is open until tickets 5–6.
- **Failed Edits:** there is no error reply for `edit:apply`. Requested from Varutieru as `edit:error` with a Node id and message; until then a failed Edit gets no reply and the Node keeps its confirmed value.
- **Additions and removals as `graph:full`:** proposed to Varutieru, untested on the extension side.
- **Shared types:** Varutieru has been asked for a PR containing only the shared package, so the copy can go.

**Draft slices** (from the interview, for `/to-tickets` to refine)

1. Set up the web app package. Blocked by: none.
2. Visual-edit loop against the fake extension (`graph:full` → select → Edit → `graph:patch`, Read-only refusal, selection kept). Blocked by: 1.
3. Load source for Code view. Blocked by: 1.
4. Text Edits. Blocked by: 2.
5. Request a Proposal (streamed text, then the Proposal). Blocked by: 1.
6. Accept or reject Changes. Blocked by: 2, 5.
7. Connect to the real broker. Blocked by: 2, the broker owner's URL and handshake. `needs-info`.
8. Selection survives a re-parse (`graph:patch` pairs, `graph:full` fallback). Blocked by: 2, Varutieru confirming the patch rules. `needs-info`.
