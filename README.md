# Clairity

A visual editor that works directly on your React/Next.js code. Click an element, drag its width, ask for "a more premium hero", and every change lands as a small diff in your own files, in your own Tailwind classes. AI suggestions come back as a list of Changes you accept or reject before anything is written.

Built for the Nebius × NVIDIA hackathon (Coding and Agentic Engineering track).

## How it works

| Part | Package | What it does |
|---|---|---|
| VS Code / Cursor extension | `packages/extension` | Runs your `next dev`, parses the file you're editing into a scene graph, and writes every change back to your source. Nothing else touches your code. |
| Web app | `packages/web` | Canvas, layer tree, inspector, AI panel, Code view and a Live view of your real page. |
| Server | `packages/server` | Pairs the extension and the web app over WebSocket, and asks Nemotron for Proposals. |
| Parser | `packages/parser` | JSX → scene graph, and the deterministic writer: a 240px width becomes `w-60`, a text edit changes one text run and nothing else. |

Visual edits never call a model: they are deterministic rewrites of the class or text you changed.

## NVIDIA Nemotron on Nebius Token Factory

AI requests ("make this hero more premium and cinematic", "make the page responsive for mobile") go to **`nvidia/nemotron-3-super-120b-a12b`** through **Nebius Token Factory**'s OpenAI-compatible API. The code is in `packages/server/src/promptAssembler.ts`.

1. The extension sends the server the selected part of the scene graph and that file's source. Your key never leaves the server.
2. The server streams a chat completion from Token Factory. It asks for structured JSON output (a JSON schema, falling back to JSON mode if the endpoint refuses it), and the model's text streams into the AI panel as it arrives.
3. Every proposed Change is checked against the nodes the model was actually shown. Unknown nodes, Read-only nodes and unsupported properties are dropped. A reply that isn't usable is retried once, with the problem explained to the model.
4. You tick the Changes you want, and the extension writes only those, all or nothing per file.

The endpoint and model are settings (`TOKEN_FACTORY_BASE_URL`, `TOKEN_FACTORY_MODEL`). `deploy/` also has Dockerfiles and a compose file to host the server and web app on a Nebius AI Cloud VM.

## Run it

You need Node.js 22+, pnpm (`corepack enable`), VS Code or Cursor, a Next.js + Tailwind project to edit, and a Token Factory API key.

```sh
pnpm install
echo "NEBIUS_API_KEY=<your key>" > packages/server/.env   # PowerShell: Set-Content packages\server\.env "NEBIUS_API_KEY=<your key>"
pnpm --filter server dev      # broker + Proposals on :8787
pnpm --filter web dev         # web app on :3100
```

Install the extension (`clairity.vsix`, or build it as described in [`docs/DEMO.md`](docs/DEMO.md)), open your project in VS Code, and the editor opens in your browser. The full walkthrough, Windows commands, a dry-run checklist and the demo script are in [`docs/DEMO.md`](docs/DEMO.md).

Without the extension, `http://localhost:3100/editor` runs against a built-in sample component, so you can try the UI on its own.

## Tests

```sh
pnpm --filter parser --filter web --filter server test
```

## Status

- Working: visual Edits, text Edits, Code view, Live view, AI Proposals with per-Change review.
- Not built yet: an agentic build → error → fix loop, resolving imported components into one tree (the canvas shows one file at a time), and frameworks other than Next.js + Tailwind.

Product spec: [`docs/specs/project-spec.md`](docs/specs/project-spec.md).

## License

[MIT](LICENSE)
