# Running the Clairity demo

Everything runs on your laptop, and every AI request goes to NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b`) on **Nebius Token Factory**.

| Piece | Where | What it does |
|---|---|---|
| Server: session broker + Proposal endpoint | Your laptop, `localhost:8787` | Holds the Token Factory key and calls Nemotron |
| Web app (canvas, inspector, AI panel) | Your laptop, `localhost:3100` | Talks to the broker over WebSocket |
| VS Code extension | Your laptop | Reads and writes your files and runs your `next dev`. Source leaves the machine only as the file sent with an AI request |
| Demo project | Your laptop | Opened in VS Code; its `next dev` feeds the Live view |

To host the server and web app on a Nebius AI Cloud VM instead, see [On a Nebius VM (optional)](#on-a-nebius-vm-optional) at the end.

## 1. Token Factory key

Get Token Factory credits through the free [Nebius Builder Program](https://dev.nebius.com/builders), then create an API key at [tokenfactory.nebius.com](https://tokenfactory.nebius.com). Check that `nvidia/nemotron-3-super-120b-a12b` is available to you.

## 2. Install the tools (once)

You need Node.js 22 or later and pnpm. In PowerShell:

```powershell
node -v                  # v22 or later
corepack enable          # makes pnpm available; run PowerShell as administrator if this fails
cd "<path-to>\clairity"
pnpm install
```

## 3. Put the key where the server finds it (once)

Create `packages\server\.env`, which git ignores, containing one line:

```
NEBIUS_API_KEY=<your Token Factory key>
```

In PowerShell:

```powershell
Set-Content -Path packages\server\.env -Value "NEBIUS_API_KEY=<your Token Factory key>"
```

Never commit this file or paste the key anywhere else.

## 4. Start the server and the web app

Open two PowerShell windows in the `clairity` folder and leave both running.

```powershell
# window 1: broker + Proposals on http://localhost:8787
pnpm --filter server dev
```

```powershell
# window 2: web app on http://localhost:3100
pnpm --filter web dev
```

Check http://localhost:8787/health in a browser. You want `"tokenFactoryKey":true`. If it says `false`, the `.env` file isn't in `packages\server`, or the server was started before you created it, so restart window 1.

## 5. Install the extension and open the demo project

Install the extension (PowerShell, in the folder holding `clairity.vsix`):

```powershell
code --install-extension .\clairity.vsix      # or: cursor --install-extension .\clairity.vsix
```

To rebuild the `.vsix`:

```powershell
cd packages\extension
pnpm run package
npx @vscode/vsce package --no-dependencies --allow-missing-repository --skip-license -o clairity.vsix
```

Make sure the demo project runs on its own once. In its folder, run `npm install`, then `npm run dev`, check http://localhost:3000, and stop it with Ctrl+C.

In the demo project, create `.vscode\settings.json`:

```json
{
  "clairity.entryFile": "components/hero-home.tsx"
}
```

This is the file the editor shows. Pick the component the demo is about: the page itself only renders `<Hero />` and friends. You can also switch with **Clairity: Edit Active File** while that file is open. The broker and web app addresses keep their defaults (`ws://localhost:8787` and `http://localhost:3100`), so nothing else goes in this file.

Open the demo project folder in VS Code. The extension starts its `next dev`, connects to the broker and opens `http://localhost:3100/editor?session=<id>` in your browser. The top bar should read **Connected · Live session**.

- If the browser didn't open: Ctrl+Shift+P → **Clairity: Open Editor**.
- To see what it's doing: **View** → **Output** → **Clairity**.

## 6. Dry run before recording

- [ ] http://localhost:8787/health shows `tokenFactoryKey: true`.
- [ ] Top bar reads **Connected · Live session**, and the layer tree shows the hero.
- [ ] Select the CTA, change its width in the inspector, and watch the file change in VS Code and the **Live** view reload.
- [ ] Ask "make this hero more premium and cinematic" once. The first real Nemotron call is the true test of the prompt. If a Change is dropped, window 1 (the server) says why.
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

## On a Nebius VM (optional)

To host the server and web app on Nebius AI Cloud, the laptop only runs VS Code and the demo project. AI Cloud needs a bank card on the account: Nebius charges $25 as prepaid balance. A 2 vCPU / 8 GB CPU VM costs about $0.08 an hour.

1. In [console.nebius.com](https://console.nebius.com), go to **Compute** → **Virtual machines** → **Create resource** → **Virtual machine**.
   - Choose **Without GPUs** and **Regular**, the smallest preset, and an Ubuntu image.
   - Set **Public IP address** to **Auto (dynamic)**, and add a username and your SSH public key.
   - The network's default security group allows inbound traffic. With a custom group, open TCP 8787 and 3100.
2. On the VM:

   ```sh
   curl -fsSL https://get.docker.com | sudo sh
   git clone https://github.com/Abhinawap/Clairity.git && cd Clairity
   cp deploy/.env.example deploy/.env      # set NEBIUS_API_KEY and PUBLIC_HOST=<VM public IP>
   sudo docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
   curl http://localhost:8787/health
   ```

3. In the demo project's `.vscode/settings.json`, add the VM's addresses next to `clairity.entryFile`:

   ```json
   {
     "clairity.brokerUrl": "ws://<VM-IP>:8787",
     "clairity.webAppUrl": "http://<VM-IP>:3100",
     "clairity.entryFile": "components/hero-home.tsx"
   }
   ```

The web app must be served over plain `http`, because the Live view frames `http://localhost:3000` from your laptop and an `https` page cannot.
Server logs: `sudo docker compose -f deploy/docker-compose.yml logs -f server`. Stop the VM when you're done, since it bills per second while running.
