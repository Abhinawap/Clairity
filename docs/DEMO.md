# Running the Clairity demo on Nebius

What runs where:

| Piece | Where | Why there |
|---|---|---|
| Server: session broker + Proposal endpoint | Nebius AI Cloud VM (Docker) | Holds the Token Factory key and calls `nvidia/nemotron-3-super-120b-a12b` |
| Web app (canvas, inspector, AI panel) | Same VM (Docker), or your laptop | Talks to the broker over WebSocket |
| VS Code extension | Your laptop | Reads and writes your files, runs your `next dev`; source never leaves the machine except the file sent with an AI request |
| Demo project | Your laptop | Opened in VS Code; its `next dev` feeds the Live view |

Your browser loads the web app from the VM and the Live view from your own `localhost`, so the web app must be served over plain `http` (an `https` page cannot frame `http://localhost`).

## 1. Token Factory key

In the Nebius Token Factory console, create an API key. Check that `nvidia/nemotron-3-super-120b-a12b` is listed for your project. To use another NVIDIA model or a regional endpoint, set `TOKEN_FACTORY_MODEL` or `TOKEN_FACTORY_BASE_URL` in step 3.

## 2. A VM on Nebius AI Cloud

In the Nebius console, create a virtual machine with:

- a small CPU-only configuration (the server needs no GPU; the model runs on Token Factory)
- an Ubuntu image
- a public IP address
- your SSH key

If your network applies a security group, allow inbound TCP **8787** (broker) and **3100** (web app). Then on the VM:

```sh
curl -fsSL https://get.docker.com | sudo sh
git clone https://github.com/Abhinawap/Clairity.git && cd Clairity
```

## 3. Start the server and web app on the VM

```sh
cp deploy/.env.example deploy/.env
# edit deploy/.env: NEBIUS_API_KEY=<key>, PUBLIC_HOST=<the VM's public IP>
sudo docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
curl http://<VM-IP>:8787/health
# → {"ok":true,"model":"nvidia/nemotron-3-super-120b-a12b","tokenFactoryKey":true}
```

`tokenFactoryKey: false` means the key didn't reach the container; check `deploy/.env`. Logs: `sudo docker compose -f deploy/docker-compose.yml logs -f server`.

## 4. Install and point the extension (laptop)

```sh
code --install-extension clairity.vsix      # or: cursor --install-extension clairity.vsix
```

To rebuild the `.vsix`:

```sh
pnpm install
cd packages/extension && pnpm run package
npx @vscode/vsce package --no-dependencies --allow-missing-repository --skip-license -o clairity.vsix
```

In VS Code settings (User, or the demo project's `.vscode/settings.json`):

```json
{
  "clairity.brokerUrl": "ws://<VM-IP>:8787",
  "clairity.webAppUrl": "http://<VM-IP>:3100",
  "clairity.entryFile": "components/hero-home.tsx"
}
```

`clairity.entryFile` is the file the editor shows. Pick the component the demo is about: the page itself only renders `<Hero />` and friends. You can also switch with **Clairity: Edit Active File** while that file is open.

## 5. Open the demo project

Open the demo project folder in VS Code. The extension starts its `next dev`, connects to the broker and opens `http://<VM-IP>:3100/editor?session=<id>` in your browser. The top bar should read **Connected · Live session**. If the browser didn't open, run **Clairity: Open Editor**. The **Clairity** output channel logs every step.

### No VM? Run everything on the laptop

The model still runs on Nebius Token Factory:

```sh
NEBIUS_API_KEY=<key> pnpm --filter server dev     # broker + Proposals on :8787
pnpm --filter web dev                              # web app on :3100
```

Leave `clairity.brokerUrl` and `clairity.webAppUrl` at their defaults.

## 6. Dry run before recording

- [ ] `/health` shows `tokenFactoryKey: true`.
- [ ] Top bar reads **Connected · Live session**, and the layer tree shows the hero.
- [ ] Select the CTA, change its width in the inspector, and watch the file change in VS Code and the **Live** view reload.
- [ ] Ask "make this hero more premium and cinematic" once. The first real Nemotron call is the true test of the prompt. If a Change is dropped, the server log says why.
- [ ] `git stash` or `git checkout .` in the demo project to reset between takes.

## Demo script, and what each step uses

1. **Open the project.** The extension opens the editor with the session.
2. **Visual Edit.** Click the hero CTA, change width or radius. The inspector sends `edit:apply`, the extension rewrites the class (240px becomes `w-60`), and **Live** shows the real page. Toggle **Visual** and **Live** to compare.
3. **Intent.** With the hero selected, prompt "make this hero more premium and cinematic". Nemotron's text streams into the AI panel.
4. **Diff review.** Untick a Change or two, then **Apply**, or **Accept All**. Only accepted Changes are written. **Code** view shows the new lines highlighted.
5. **Whole page.** Switch scope to **Whole Page** and prompt "make the page responsive for mobile". The model proposes class Changes (`md:`/`sm:` variants). Accept, then check **Live** in a narrow window.
6. **Code view.** Toggle **Code**: the same file the inspector edits.

**Not built: the agentic build → error → fix loop (project spec v2).** There is no `next build` step or error feedback in the product. Step 5 above is a real page-scoped Proposal, not that loop; don't present it as one.

## Known limits

- One file on the canvas at a time; imports are not resolved into one tree.
- Ids are positions, so an Edit that shifts a node resends the whole scene graph and the selection may clear.
- The canvas draws the scene graph, and only knows the Tailwind classes the web app was built with. **Live** shows the real result.
- Class Changes that the canvas can't draw (shadows, tracking) show in **Live** and **Code**, not **Visual**.
