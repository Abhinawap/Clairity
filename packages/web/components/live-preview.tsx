"use client";
import { ExternalLink, RotateCw } from "lucide-react";
import { useState } from "react";
import { useSession } from "../data/session-provider";

// The project's own page from its dev server, which hot-reloads after every write the extension makes, so this is
// the real result of each Edit and accepted Change. The dev server runs on the developer's machine, so the frame
// loads it from there too.
export function LivePreview() {
  const devServerUrl = useSession((s) => s.devServerUrl);
  const [reloads, setReloads] = useState(0);
  if (!devServerUrl) {
    return <p className="m-auto max-w-sm p-6 text-center text-xs text-zinc-500">The extension hasn&apos;t reported the project&apos;s dev server yet.</p>;
  }
  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 text-xs dark:border-zinc-800">
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
        <span className="font-mono">{devServerUrl}</span>
        <button
          type="button"
          onClick={() => setReloads((n) => n + 1)}
          aria-label="Reload the page"
          className="ml-auto inline-flex cursor-pointer items-center rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <RotateCw className="size-3.5" aria-hidden />
        </button>
        <a href={devServerUrl} target="_blank" rel="noreferrer" aria-label="Open in a new tab" className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      <iframe key={reloads} src={devServerUrl} title="Live site" className="min-h-0 flex-1 border-0" />
    </div>
  );
}
