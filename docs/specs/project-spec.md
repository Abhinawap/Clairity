# Project Spec — Visual Frontend Dev Tool

**Hackathon:** Nebius × NVIDIA — Coding and Agentic Engineering track
**Status:** Draft v1 — 5 September 2026

---

## Definition

A visual design tool in the spirit of Figma, Framer and Canva that operates directly on a real React/Next.js codebase instead of a proprietary design file. The developer's local source files are the only artifact: every visual edit becomes a minimal, reviewable code diff in their own files, in their own styling convention, and every AI-assisted edit is proposed as a diff they accept or reject before anything is written to disk.

We build it as three TypeScript components: a VS Code/Cursor extension that owns file access, parsing and code writing; a Next.js web app that provides the canvas, layer tree, inspector and AI panel; and a lightweight Hono backend on Nebius AI Cloud that brokers sessions and calls NVIDIA Nemotron models on Nebius Token Factory. The central mechanism is an intermediate representation — a scene graph parsed from JSX with a `source: {file, line}` pointer on every node — that the visual editor manipulates and a deterministic transformer writes back to code.

---

## Key Components

- **Part 1: Product requirements** — who it is for, what problems it solves, what it does, and the milestones of functionality.
- **Part 2: Technical design** — tech stack, system architecture, key components, component interactions, data model and API design, and other technical details.

---

# Part 1: Product Requirements

## 1.1 Product Definition

### Who is the product for?

The primary user is a frontend developer or design-engineer who already owns a React/Next.js codebase and wants to iterate on its visual design without leaving that codebase. They are comfortable in VS Code or Cursor, have a dev server they can run locally, and use Tailwind or a similar utility/inline styling convention. They are not looking for a tool to generate a site from scratch; they want to reshape what already exists.

The secondary user is a designer or product person working alongside that developer who wants to make direct visual adjustments (spacing, sizing, color, copy) to the real product without filing a ticket or learning the codebase. For the hackathon MVP, the developer is the only user we design for; the designer persona is explicitly deferred.

### What problems does it solve?

Today the design and code representations of a frontend live in two disconnected worlds. A change made in Figma has to be re-described and re-implemented by hand in code, and a change made in code never flows back to the design file. Every round trip costs time and introduces drift between the mockup and the shipped product.

Existing visual builders (Webflow, Framer, Builder.io) solve this by owning the code: they export to their own proprietary format or a generated codebase the developer did not write and cannot easily maintain. AI website builders (v0, Lovable, Bolt) regenerate whole components from prompts, which makes small, precise adjustments unpredictable and makes it hard to trust that the rest of the file was left alone.

This product removes the round trip by making the developer's real source files the only artifact. A visual edit produces a minimal, reviewable code diff in the developer's existing file, in the developer's existing styling convention. An AI-assisted edit is proposed as a diff the developer accepts or rejects, never silently applied. The developer keeps their editor, their Git workflow, and full ownership of the code.

### What does the product do?

The developer installs a VS Code/Cursor extension and opens their existing Next.js project. The extension starts the project's dev server, connects to the web app over WebSocket, and parses the JSX components of the current page into a scene graph, where each node carries its element type, resolved style properties, children, and a pointer to the exact file and line it came from.

The web app renders a canvas showing the live page alongside a layer tree of that scene graph. The developer clicks an element on the canvas or in the tree to select it. A property inspector displays the selected element's editable properties (width, height, padding, margin, border radius, background color, text color, font size, text content). When the developer changes a property in the inspector, the tool computes the corresponding code change deterministically, without any model call, and writes it to the source file. For example, dragging a button's width to 240px on a Tailwind project rewrites `w-48` to `w-60` in the button's className; on an inline-style project it rewrites `width: 192` to `width: 240`. The dev server hot-reloads and the canvas reflects the change within a second.

The developer can also type a natural-language request into the AI panel, either scoped to a selected element ("make this hero more premium and cinematic") or to the whole page ("make the page responsive for mobile"). The tool sends the relevant scene-graph subtree, the source code of the affected components, and the project's detected styling convention to an NVIDIA open-source model running on Nebius Token Factory. The model returns a set of proposed property changes and, where needed, structural changes such as added or reordered elements. These appear as a list of discrete diffs the developer can review individually; each shows the before and after for the affected file lines. The developer accepts all, rejects all, or accepts a subset, and only accepted changes are written to disk.

For requests that require verification, the agent runs a build-fix-render loop: after writing changes it triggers a build, reads any compile or lint errors, sends those errors back to the model with the changed code, applies the fix, and re-renders. The developer sees each step of this loop in the AI panel and can stop it at any point.

At all times the developer can toggle the canvas between Visual view and Code view. Code view shows the actual source file with the selected element's lines highlighted, proving that the canvas and the code are two views of the same live project rather than a design file and an export.

## 1.2 Goals and Milestones

### Q1: What are you really trying to do? What are the goals for the project?

The goal is to prove that a Figma-style visual manipulation model can operate directly on a production React/Next.js codebase, with the developer's source files as the only artifact. Concretely, for the hackathon we are trying to demonstrate three things in a single live session on a real Next.js project:

1. A visual edit in a canvas inspector becomes a minimal, correct code diff in the developer's own file, in their own styling convention, with no LLM involved.
2. A natural-language design request becomes a reviewable set of proposed diffs generated by an NVIDIA open-source model on Nebius Token Factory, which the developer accepts or rejects before anything touches disk.
3. An agentic request can run a build → detect error → fix → re-render loop end to end, visible to the developer at every step.

Secondary goals: satisfy the hackathon constraints (Nebius AI Cloud / Token Factory, at least one NVIDIA open-source model, Coding and Agentic Engineering track) and land a demo that is credible to a frontend developer, meaning the tool never breaks their code and never hides what it changed.

Non-goals: building a general-purpose website generator, a new IDE, or a Figma replacement. We are building a layer on top of an existing editor and existing code.

### Q2: What are the milestones of functionality?

| Version | Core app functionality |
|---|---|
| **MVP** | • Single user, single local project<br>• **Project connection:** User installs the VS Code/Cursor extension, opens a Next.js project, and the extension connects to the web app over WebSocket and starts the dev server<br>• **Scene graph parsing:** Extension parses the JSX of the current page into a scene graph where every node carries a `source: {file, line}` pointer; supports one styling convention (whichever the demo project uses, likely Tailwind)<br>• **Canvas + layer tree:** Web app renders the live page in a canvas next to a tree view of the scene graph; clicking an element in either selects it and highlights it in both<br>• **Property inspector (deterministic edits):** User edits width, height, padding, margin, border radius, background color, text color, and text content of the selected element; each edit is written to the source file as a direct code change with no model call and the canvas hot-reloads<br>• **Intent mode (single example):** User types a natural-language request scoped to a selected element; the tool sends scene-graph subtree + source + styling convention to the NVIDIA model on Token Factory and applies the returned property changes to the file<br>• **Visual/Code toggle:** User switches the canvas to a Code view showing the actual source file with the selected element's lines highlighted |
| **v1** | • **Diff review UI:** Intent-mode results appear as a list of discrete changes with before/after code; user can accept all, reject all, or accept individually, and only accepted changes are written<br>• **Broader property coverage:** Inspector adds font size, font weight, line height, flex/grid alignment, gap, opacity, shadow, and border<br>• **Styling-convention detection:** Tool detects whether a component uses Tailwind classes, inline styles, or CSS-in-JS and emits edits in the matching convention instead of assuming one<br>• **Parse-failure fallback:** Elements that cannot be mapped cleanly to source are shown in the tree as read-only with a reason; the rest of the page stays editable<br>• **Page-level intent requests:** Natural-language requests can target the whole page, not only a selected element |
| **v2** | • **Agentic build-fix-render loop:** After applying changes, the agent runs the build, reads compile/lint errors, sends them back to the model with the changed code, applies the fix, and re-renders; each step is shown in the AI panel and the user can stop the loop<br>• **Multi-element and cross-file intents:** A single request can propose coordinated changes across several components and files (e.g. "make the page responsive for mobile")<br>• **Shared component detection:** When an edited element is an instance of a reusable component, user is asked whether to change the shared component or override this instance |
| **Later** | • **Session persistence:** Project and session metadata (not source code) stored in the cloud so a user can resume where they left off<br>• **Collaboration:** A second user can join a session and see the same canvas and selection<br>• **Multi-framework support:** Vue, Svelte, plain React without Next.js<br>• **Animation and theming tools:** Editing transitions, keyframes, and design-token files from the inspector<br>• **Plugin ecosystem:** Third-party inspector panels and transforms |
| **Not in scope for now** | Custom IDE, editor, terminal, debugger, or Git client; real-time multiplayer editing; arbitrary framework support; perfect parsing of unconstrained code; user accounts, auth, payments; syncing full source code to the cloud |

### Demo script (definition of done for MVP + v1)

1. Open an existing Next.js project.
2. Visual mode: click a hero CTA button, change width/radius in the inspector, see the live site update instantly.
3. Intent mode: type "make this hero more premium and cinematic" → model proposes a set of changes.
4. Show a diff of proposed changes (e.g. 7 changes) → Accept All.
5. Agentic ask: "make the page responsive for mobile" → agent inspects, edits, builds, catches an error, fixes it, re-renders.
6. Toggle between Visual view and Code view to prove it's the same live project.

---

# Part 2: Technical Design

## 2.1 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Programming language | TypeScript everywhere (extension, web app, backend) | One language, shared types for the scene graph and WebSocket protocol across all three components |
| Editor host | VS Code Extension API (also runs in Cursor) | Gives us file access, file watching, terminal/process control and a webview for free; avoids building an IDE |
| Web app | Next.js 15 (App Router) + React 19 + Tailwind CSS | Same stack as the target projects, so the team dogfoods the parser on its own code |
| State management | Zustand | Small, no boilerplate; scene graph, selection and pending-diff state live in one store |
| Canvas | Custom: dev-server page rendered in a sandboxed `<iframe>` with a transparent overlay for selection outlines and drag handles | React Flow rejected: it draws its own nodes, but we need to show the *real* rendered page. The overlay reads element bounding boxes via `postMessage` from a small runtime script injected into the page |
| Layer tree / inspector | Plain React components (Radix UI primitives for inputs, popovers, color picker) | No need for a graph library; the scene graph is a tree |
| Code view | Monaco Editor (read-only for MVP) | Highlights the selected node's source lines; editing in Monaco is deferred to v1 |
| JSX parsing | `@babel/parser` + `@babel/traverse` with `jsx` and `typescript` plugins | Mature, precise `loc` info per node, and the same AST is reused for code transforms |
| Code transforms | `@babel/generator` via `recast` for print-preserving edits | `recast` only reprints modified nodes, so diffs are minimal and the developer's formatting survives |
| Tailwind class mapping | `tailwindcss` resolver + a hand-written `class ↔ CSS property` table for the properties we support | Deterministic mapping in both directions (`w-48` ↔ `width: 12rem`) |
| Backend | Node.js 22 + Hono, one process serving REST + WebSocket | Lightweight; runs identically locally and in a container on Nebius AI Cloud |
| Database | SQLite via `better-sqlite3` for MVP; Postgres on Nebius AI Cloud if sessions need to be shared (v1+) | Cloud stores only session/project metadata, never source code |
| AI inference | Nebius Token Factory, OpenAI-compatible API (`https://api.tokenfactory.us-central1.nebius.com/v1/`). Primary model: `nvidia/nemotron-3-super-120b-a12b` for intent mode and the agent loop; `nvidia/nemotron-3-nano-30b-a3b` for cheap classification tasks (styling-convention detection, request scoping) | Nemotron 3 Super is a 120B hybrid MoE model with 12B active parameters and up to 1M token context, built for long-horizon planning, tool calling and instruction following. Nemotron 3 Nano 30B A3B is a small, compute-efficient MoE model at roughly $0.06/M input tokens. Both are NVIDIA open-weight models, satisfying the hackathon constraint |
| Compute / VMs | Nebius AI Cloud: one CPU VM (or container) hosting the backend; one on-demand container per agent session for the build-fix-render sandbox (v2) | Satisfies the "runs on Nebius" constraint; the sandbox isolates `npm run build` from the user's machine |
| Dev server | The user's own `next dev` process, started by the extension | Hot reload is what makes the canvas update after each edit |

Rejected earlier: a fully custom IDE (Tauri + Rust + Monaco) — too slow for the hacktahon timeline; the extension approach reuses existing IDE infrastructure.

## 2.2 System Architecture Overview

Three runtime components, with the developer's local filesystem as the single source of truth:

```
┌──────────────────────────┐    WebSocket (JSON)    ┌────────────────────────────┐
│  VS Code / Cursor        │◄──────────────────────►│  Web App (Next.js)         │
│  Extension (local)       │                        │  canvas · layer tree ·     │
│                          │                        │  inspector · AI panel      │
│  • FS read/write/watch   │                        │                            │
│  • starts `next dev`     │        ┌───────────────┤  ◄── iframe → localhost:3000│
│  • Babel parse → IR      │        │  REST/WS      │       (user's dev server)  │
│  • IR edit → code diff   │        ▼               └────────────────────────────┘
└──────────────────────────┘  ┌────────────────────────────┐
                              │  Backend (Hono, Nebius     │
                              │  AI Cloud)                 │
                              │  • session broker          │
                              │  • prompt assembly         │
                              │  • agent loop orchestrator │
                              │  • SQLite/Postgres metadata│
                              └─────────────┬──────────────┘
                                            │ OpenAI-compatible HTTPS
                                            ▼
                              ┌────────────────────────────┐
                              │  Nebius Token Factory      │
                              │  nvidia/nemotron-3-super   │
                              │  nvidia/nemotron-3-nano    │
                              └────────────────────────────┘
```

The extension owns all parsing and code writing so that source code never leaves the machine for visual-mode edits. For intent mode, only the scene-graph subtree, the source of the affected components, and the styling convention are sent to the backend; the backend forwards them to Token Factory and streams the proposal back. The web app never writes files itself; it sends edit commands to the extension.

## 2.3 Key Components

### Extension (`packages/extension`)

- **Session manager:** on activation, generates a session ID, opens a WebSocket to the backend, and registers the workspace root. Runs `next dev` as a child process and reports the URL to the web app.
- **Parser:** takes a route (e.g. `/app/page.tsx`), resolves imported components one level deep, parses each file with Babel, and walks JSX elements to emit scene-graph nodes. Each node records `source: {file, line, column, endLine, endColumn}` from the Babel `loc`. Elements whose props are spread (`{...props}`), computed (`className={cn(...)}` with non-literal args) or conditionally rendered in ways the parser cannot resolve are emitted with `editable: false` and a `reason`.
- **Style resolver:** for Tailwind projects, splits the `className` string literal into tokens and maps each known token to a CSS property via the lookup table; unknown tokens are kept verbatim as `passthrough`. For inline-style projects (v1), reads the `style={{...}}` object literal.
- **Transformer:** receives `{nodeId, property, value}`, locates the node's AST path by `source`, and rewrites the relevant class token or style property. Reprints with `recast`, writes the file, and emits a `file:changed` event. The transformer is pure and unit-tested against fixtures: `(sourceFile, edit) → newSourceFile`.
- **Watcher:** `vscode.workspace.createFileSystemWatcher` on `**/*.{tsx,jsx}`; on external changes it re-parses the affected file and pushes the updated subtree so the tree stays in sync with edits made directly in the editor.
- **Diff applier:** for intent-mode proposals, applies a list of `Change` objects atomically (all or none per file) and reports success or a parse error back.

### Web App (`packages/web`)

- **Canvas:** iframe of the dev server plus an absolutely positioned overlay. A runtime script (`inspector-runtime.js`, injected by a Next.js dev-only `<Script>` the extension adds to `app/layout.tsx`) tags DOM elements with `data-ir-id` based on a build-time Babel plugin and posts bounding rects on hover, click and resize. The overlay draws selection outlines and drag handles; dragging a handle emits an `edit:apply` message.
- **Layer tree:** recursive tree of the scene graph with two-way selection sync with the canvas.
- **Inspector:** property groups (Layout, Spacing, Border, Fill, Typography, Content). Each control is bound to a node property; committing a value emits `edit:apply`. Non-editable nodes show the parser's reason.
- **AI panel:** prompt input, scope selector (selected element / page), streaming response area, and the diff list (v1) with per-change accept/reject and a "why" line from the model.
- **Code view:** Monaco showing the current file; selecting a node scrolls to and highlights its `source` range.
- **Store (Zustand):** `sceneGraph`, `selectedNodeId`, `hoveredNodeId`, `pendingProposal`, `agentLog`, `connectionState`.

### Backend (`packages/server`)

- **Session broker:** pairs the extension socket and the web-app socket that share a session ID; relays messages between them. This is what lets the web app run on a hosted URL while the code stays local.
- **Prompt assembler:** builds the Token Factory request from the intent, scene-graph subtree, component source, styling convention, and a fixed system prompt that constrains output to the `Proposal` JSON schema.
- **Agent orchestrator (v2):** runs the build-fix-render loop as a state machine (`propose → apply → build → parse errors → fix → apply → build … → done | stopped | max_iterations`) inside a Nebius container that has the user's project synced via `rsync` over the session.
- **Metadata store:** sessions, projects (path hash, framework, styling convention), proposal history. No source code.

## 2.4 How the Components Interact

### Flow A: Visual-mode edit (deterministic, no LLM)

1. User drags the width handle on a button in the canvas.
2. Overlay emits `edit:apply {nodeId: "n_42", property: "width", value: "240px"}` to the store; the web app sends it over WebSocket to the backend, which relays it to the extension.
3. Extension transformer resolves `n_42 → app/page.tsx:31:8`, finds the class token `w-48`, maps `240px → 15rem → w-60`, rewrites the className, and reprints the file with `recast`.
4. File write triggers Next.js HMR; the iframe re-renders in under a second.
5. Extension emits `graph:patch` with the updated node; the store applies it; the inspector shows `240px`.

Target latency: under 150 ms from drop to file write, excluding HMR.

### Flow B: Intent-mode request (v1 form with diff review)

1. User selects the hero section and types "make this hero more premium and cinematic".
2. Web app sends `intent:request {sessionId, scope: "node", nodeId: "n_7", prompt}` to the backend.
3. Backend asks the extension for `graph:subtree n_7` and `source:read` for the files it spans; extension returns them.
4. Prompt assembler calls Token Factory `POST /v1/chat/completions` with `model: nvidia/nemotron-3-super-120b-a12b`, `response_format: {type: "json_schema", …Proposal}`, `stream: true`.
5. Backend streams `intent:proposal.partial` events to the web app as changes arrive; the AI panel renders them incrementally.
6. User accepts 5 of 7 changes. Web app sends `proposal:apply {proposalId, acceptedChangeIds}`.
7. Extension applies the accepted changes per file atomically, re-parses, and emits `graph:patch`. If a file fails to parse after the edit, the write is rolled back and `proposal:error` is returned with the Babel message.

### Flow C: Agentic build-fix-render (v2)

1. User types "make the page responsive for mobile" with scope `page`.
2. Backend spins up (or reuses) the session's Nebius sandbox container, syncs the project, and starts the orchestrator.
3. Loop: model proposes changes → extension applies locally and sandbox applies its copy → sandbox runs `next build` → on failure, stderr is parsed for `file:line: message` and fed back with the changed files → model returns a fix → repeat. Max 4 iterations.
4. Each state transition is emitted as `agent:step {step, status, detail}` so the AI panel shows a live log. `agent:stop` from the user aborts after the current step and leaves the last successfully applied state on disk.

## 2.5 Data Model and API Design

### Scene graph node (shared type, `packages/shared/ir.ts`)

```ts
type IRNode = {
  id: string;                        // stable hash of file + loc + element name
  type: "element" | "component" | "text";
  name: string;                      // "button", "Hero", "#text"
  props: Record<string, string | number | boolean>;
  style: {                           // resolved, framework-agnostic
    width?: string; height?: string;
    padding?: BoxValue; margin?: BoxValue;
    borderRadius?: string; backgroundColor?: string; color?: string;
    fontSize?: string; fontWeight?: string; lineHeight?: string;
    display?: string; gap?: string; alignItems?: string; justifyContent?: string;
    opacity?: string; boxShadow?: string; border?: string;
  };
  styleSource: "tailwind" | "inline" | "css-in-js" | "unknown";
  passthroughClasses?: string[];     // Tailwind tokens we don't model
  text?: string;                     // for text runs
  children: IRNode[];
  source: { file: string; line: number; column: number; endLine: number; endColumn: number };
  editable: boolean;
  reason?: string;                   // why not editable
};
```

### WebSocket protocol

All messages are `{type, sessionId, payload}`; the backend relays between web app and extension.

| Direction | Type | Payload |
|---|---|---|
| ext → web | `session:ready` | `{devServerUrl, framework, styleSource}` |
| ext → web | `graph:full` | `{root: IRNode}` |
| ext → web | `graph:patch` | `{nodes: IRNode[], idMap?: Record<string,string>}` (replace by id) |
| web → ext | `edit:apply` | `{nodeId, property, value}` |
| web → ext | `text:apply` | `{nodeId, text}` |
| web → ext | `source:read` | `{file}` → reply `source:content {file, content}` |
| web → backend | `intent:request` | `{scope: "node" \| "page", nodeId?, prompt}` |
| backend → web | `intent:proposal.partial` / `intent:proposal.done` | `{proposalId, changes: Change[]}` |
| web → ext | `proposal:apply` | `{proposalId, acceptedChangeIds}` |
| ext → web | `proposal:applied` / `proposal:error` | `{proposalId, files: string[]}` / `{proposalId, file, message}` |
| backend → web | `agent:step` | `{step, status: "running" \| "ok" \| "failed", detail}` |
| web → backend | `agent:stop` | `{}` |

### Proposal schema (model output, enforced via `response_format`)

```ts
type Proposal = { summary: string; changes: Change[] };

type Change =
  | { id: string; kind: "style";  nodeId: string; property: keyof IRNode["style"]; value: string; why: string }
  | { id: string; kind: "text";   nodeId: string; text: string; why: string }
  | { id: string; kind: "class";  nodeId: string; add: string[]; remove: string[]; why: string }   // Tailwind-native
  | { id: string; kind: "insert"; parentId: string; index: number; jsx: string; why: string }      // v2
  | { id: string; kind: "source"; file: string; range: Range; replacement: string; why: string }; // agent fallback
```

The model is asked for `style`/`text`/`class` changes first because the extension can validate them against the scene graph before touching a file; `source` changes are allowed only in the agent loop and are always shown as raw diffs.

### REST endpoints (backend, minimal)

- `POST /sessions` → `{sessionId, wsUrl}`
- `GET /sessions/:id` → session metadata
- `POST /sessions/:id/proposals` (internal, called by the WS handler)
- `GET /sessions/:id/proposals` → proposal history (Later)

### Database schema (SQLite for MVP)

```
sessions   (id TEXT PK, created_at, last_seen_at, ext_connected BOOL, web_connected BOOL)
projects   (id TEXT PK, session_id FK, root_hash TEXT, framework TEXT, style_source TEXT)
proposals  (id TEXT PK, session_id FK, scope TEXT, prompt TEXT, model TEXT,
            changes_json TEXT, accepted_ids_json TEXT, created_at)
agent_runs (id TEXT PK, proposal_id FK, iterations INT, final_status TEXT, log_json TEXT)
```

No file contents are stored in any table.

## 2.6 Other Technical Details

**Styling-convention decision for MVP.** Support Tailwind only. The demo project is a Tailwind Next.js starter, and the token table covers exactly the inspector properties listed in Part 1. Inline-style and CSS-in-JS resolvers are separate modules behind the same `StyleResolver` interface so v1 can add them without touching the transformer.

**Node identity across reparses.** `id` is `sha1(file + elementName + line + column)`. If a file changes above a node, its line shifts and its id changes; the watcher emits a `graph:patch` with an `idMap` so the store can preserve the current selection.

**Mapping DOM ↔ IR.** A dev-only Babel plugin (registered in `next.config.js` by the extension) injects `data-ir-id` on every JSX element with the same hash the parser produces. This is what lets a click in the iframe resolve to a scene-graph node without heuristics.

**Prompt design for intent mode.** System prompt states the output schema, the allowed property set, the styling convention, and the rule "never change props or children you were not shown". Context includes the subtree as JSON, the component source, and a 20-line excerpt of `tailwind.config` if custom tokens exist. Typical request is 4–8k tokens; Nemotron 3 Super's context budget is not a constraint.

**Failure handling.** Parser failure on a file → that file's nodes are marked non-editable, others remain live. Transform produces unparsable output → write is rolled back from an in-memory copy, `proposal:error` surfaces the Babel message. Token Factory timeout (> 60 s) or schema violation → one automatic retry with the validation error appended, then a user-visible error. WebSocket drop → both clients reconnect with the same `sessionId`; the extension resends `graph:full`.

**Security.** The web app never receives filesystem access; every write goes through the extension, which restricts writes to the workspace root and to `.tsx/.jsx` files. The backend holds the Nebius API key; the extension and web app never see it. The iframe uses `sandbox="allow-scripts allow-same-origin"` and the runtime script only posts messages to the configured web-app origin.

**Hackathon deployment.** Backend runs as a single Docker container on a Nebius AI Cloud VM behind HTTPS; web app is deployed on the same VM (Next.js standalone build) or Vercel with the backend URL as an env var. The extension is installed from a `.vsix` in the repo. Judges see the Nebius console for the VM and the Token Factory usage dashboard for model calls.

**Open technical questions carried into implementation.**

1. Whether `recast` preserves Prettier formatting well enough on the demo project, or whether we run Prettier after each write.
2. Whether Nemotron 3 Super's structured-output mode on Token Factory supports the full `Change` union or needs a flatter schema.
3. Sandbox sync mechanism for v2 (`rsync` over SSH vs. tarball upload per iteration).

---

## Appendix: Pre-Spec TODOs Still Open

- [ ] Confirm hackathon deadline, judging rubric, submission requirements (repo, video, live demo?).
- [ ] Decide team roles if working with others.
- [ ] **Spike: parse a real Next.js component into an AST and produce the first scene-graph JSON fixture.**
  *What "spike" means:* a short, throwaway experiment (half a day at most) done to de-risk an assumption before building on it. Nothing from a spike is expected to ship.
  *What we're de-risking:* the whole IR idea. The spec assumes JSX can be turned into a scene graph with reliable `source: {file, line}` pointers, but this has not been tried on the actual demo project.
  *What to do:* take one real component file from the demo project (e.g. the hero section), run it through `@babel/parser`, walk the JSX nodes with `@babel/traverse`, and hand-write the `IRNode` JSON the parser *should* produce for it. Save that JSON as the first test fixture so the parser is built against a concrete target.
  *What we expect to learn:* how precise Babel's `loc` info is; what `className` values built with `cn()` or template literals look like in the AST; how often the demo project hits the "not editable" cases; whether resolving imported components one level deep is enough.
  *Why it comes first:* if the parser cannot produce a usable graph, the rest of the architecture changes, so this must happen before any UI work.

- [ ] **Verify Token Factory structured-output support for the `Proposal` schema against `nvidia/nemotron-3-super-120b-a12b`.**
  *What "structured output" means:* asking the model to return JSON that conforms to a schema we supply (`response_format: {type: "json_schema", ...}` in the OpenAI-compatible API) instead of free text. Intent mode depends on this so the returned `Proposal` can be validated and applied without fragile text parsing.
  *What is unverified:* (a) whether Token Factory honours `json_schema` mode for this specific model — some providers only support plain `json_object` mode, or only for certain models; (b) whether the `Change` type as written, a discriminated union of five variants, is accepted — some structured-output implementations reject `oneOf`/`anyOf` unions or nested enums.
  *What to do:* write a single script that sends one intent request with the schema and inspect the result: valid JSON, a schema-rejection error, or free text wrapped in markdown fences. About one hour.
  *Fallback if unions are unsupported:* flatten to a single `Change` object with optional fields and a `kind` string, and validate on our side with Zod.
  *Why it matters:* the outcome decides how the prompt assembler and the diff applier are written.

- [ ] **Confirm Monaco code pane stays read-only in MVP (current decision: yes).**
  *What Monaco is:* the code editor component that powers VS Code, published by Microsoft as a standalone open-source library embeddable in any web page. It provides syntax highlighting, line numbers, minimap, bracket matching, find/replace, and an API for decorations (highlighting a line range), scrolling to a position, and toggling read-only mode. It understands TypeScript/JSX out of the box.
  *Why we use it:* the Code view needs to show the real source file with the selected element's lines highlighted, which is a couple of Monaco API calls, and it looks like the editor the developer already uses, reinforcing the "same project, two views" message in the demo.
  *Why read-only in MVP:* the Code view exists to prove the canvas and the source are the same live project; displaying and highlighting is enough for that. Making it editable adds a second write path into the filesystem, which means resolving conflicts between Monaco edits, inspector edits, and the file watcher, plus debouncing and cursor preservation on reparse. None of that helps the demo and it competes for time with the parser and transformer.
  *Status:* this is a decision to confirm, not a task. The prep notes had the code pane marked as ambiguous between MVP and v1; the decision is read-only in MVP, with editing considered in v1 once the single write path through the extension is solid.
