# Clairity for VS Code and Cursor

Edit your React/Next.js page visually. Every change becomes a small diff in your own files, in your Tailwind classes, and every AI suggestion is a list of Changes you accept or reject before anything is written.

## How it works

When you open a project folder, the extension:

1. starts your project's `next dev`,
2. connects to the Clairity server (session broker) and
3. opens the Clairity editor in your browser, already joined to this session.

The editor shows the file's scene graph on a canvas, in a layer tree and in an inspector. Edits you make there are written to your file by this extension; nothing else ever writes your code. AI requests go to the Clairity server, which asks NVIDIA Nemotron on Nebius Token Factory, and come back as Changes for you to review.

## Commands

- **Clairity: Edit Active File**: show the file open in the editor, for example the hero component your page imports.
- **Clairity: Open Editor**: open the editor for this session again.

## Settings

| Setting | Default | What it is |
|---|---|---|
| `clairity.brokerUrl` | `ws://localhost:8787` | The Clairity server's WebSocket address, e.g. `ws://<your-nebius-vm>:8787`. |
| `clairity.webAppUrl` | `http://localhost:3100` | The Clairity web app's address. |
| `clairity.entryFile` | (empty: `app/page.tsx`) | The project-relative file the editor shows when the session starts. |

The extension only writes `.tsx`/`.jsx` files inside your workspace. Output is in the **Clairity** output channel.
