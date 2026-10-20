"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ToggleGroup } from "radix-ui";
import { useSession } from "../data/session-provider";
import { ThemeToggle } from "./theme-toggle";

export type View = "visual" | "code";

export function TopBar({ view, onViewChange }: { view: View; onViewChange(view: View): void }) {
  const file = useSession((s) => s.roots[0]?.source.file);
  const connection = useSession((s) => s.connection);
  return (
    <header className="col-span-3 flex h-11 items-center gap-3 border-b border-zinc-200 px-3 dark:border-zinc-800">
      <Link
        href="/"
        aria-label="Back to projects"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        <span>Projects</span>
      </Link>
      <span className="text-zinc-300 dark:text-zinc-700" aria-hidden>/</span>
      <span className="font-semibold">Clairity</span>
      {file && <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{file}</span>}
      <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400" role="status">
        <span
          aria-hidden
          className={`size-2 rounded-full ${connection === "connected" ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`}
        />
        {connection === "connected" ? "Connected" : "Connecting…"}
        {/* shortcut: always the fake until the broker connection exists (web-data-layer slice 7) */}
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">Fake extension</span>
      </span>
      <ToggleGroup.Root
        type="single"
        value={view}
        // Radix sends "" when the active item is clicked again; keep the current view instead.
        onValueChange={(v) => v && onViewChange(v as View)}
        aria-label="Canvas view"
        className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800"
      >
        {(["visual", "code"] as const).map((v) => (
          <ToggleGroup.Item
            key={v}
            value={v}
            className="rounded px-2.5 py-1 text-xs capitalize text-zinc-600 focus-visible:outline-2 focus-visible:outline-blue-500 data-[state=on]:bg-white data-[state=on]:text-zinc-900 data-[state=on]:shadow-sm dark:text-zinc-400 dark:data-[state=on]:bg-zinc-950 dark:data-[state=on]:text-zinc-100"
          >
            {v}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <ThemeToggle />
    </header>
  );
}
