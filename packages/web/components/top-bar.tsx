"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ToggleGroup } from "radix-ui";
import { useSession } from "../data/session-provider";
import { ThemeToggle } from "./theme-toggle";

export type View = "visual" | "code";

export function TopBar({ view, onViewChange }: { view: View; onViewChange(view: View): void }) {
  const file = useSession((s) => s.roots[0]?.source.file);
  const connection = useSession((s) => s.connection);
  return (
    <header className="col-span-3 flex h-11 items-center gap-3 border-b border-[#004346]/70 bg-[#080C0E] px-3 text-[#F2FBF9]">
      <Link
        href="/"
        aria-label="Back to projects"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#DAF5EE] hover:bg-[#004346] hover:text-[#F2FBF9] focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        <span>Projects</span>
      </Link>
      <span className="text-[#004346]" aria-hidden>/</span>
      <Link href="/" className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#09BC8A]">
        <Image
          src="/logos/Clairity_White.svg"
          alt="Clairity"
          width={88}
          height={18}
          priority
          className="h-4.5 w-auto"
        />
      </Link>
      {file && <span className="font-mono text-xs text-[#DAF5EE]/70">{file}</span>}
      <span className="ml-auto flex items-center gap-1.5 text-xs text-[#DAF5EE]" role="status">
        <span
          aria-hidden
          className={`size-2 rounded-full ${connection === "connected" ? "bg-[#09BC8A]" : "animate-pulse bg-[#004346]"}`}
        />
        {connection === "connected" ? "Connected" : "Connecting…"}
        {/* shortcut: always the fake until the broker connection exists (web-data-layer slice 7) */}
        <span className="rounded bg-[#004346] px-1.5 py-0.5 text-[#DAF5EE]">Fake extension</span>
      </span>
      <ToggleGroup.Root
        type="single"
        value={view}
        // Radix sends "" when the active item is clicked again; keep the current view instead.
        onValueChange={(v) => v && onViewChange(v as View)}
        aria-label="Canvas view"
        className="flex rounded-md bg-[#172A3A] p-0.5 border border-[#004346]/60"
      >
        {(["visual", "code"] as const).map((v) => (
          <ToggleGroup.Item
            key={v}
            value={v}
            className="rounded px-2.5 py-1 text-xs capitalize text-[#DAF5EE]/70 focus-visible:outline-2 focus-visible:outline-[#09BC8A] data-[state=on]:bg-[#09BC8A] data-[state=on]:text-[#080C0E] data-[state=on]:font-semibold data-[state=on]:shadow-xs transition-colors"
          >
            {v}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <a
        href="https://github.com/Abhinawap/Clairity"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub repository"
        className="grid size-8 place-items-center rounded-md text-[#DAF5EE] hover:bg-[#004346] focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
      >
        <Image
          src="/logos/GitHub_Invertocat_White.svg"
          alt=""
          width={16}
          height={16}
          className="size-4"
          aria-hidden
        />
      </a>
      <ThemeToggle />
    </header>
  );
}
