"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ToggleGroup } from "radix-ui";
import { useSession } from "../data/session-provider";
import { ThemeToggle } from "./theme-toggle";

// visual: the scene graph on the canvas. live: the project's own running page. code: the source.
export type View = "visual" | "live" | "code";

export function TopBar({ view, onViewChange }: { view: View; onViewChange(view: View): void }) {
  const file = useSession((s) => s.roots[0]?.source.file);
  const connection = useSession((s) => s.connection);
  const extension = useSession((s) => s.extension);
  const devServerUrl = useSession((s) => s.devServerUrl);
  return (
    <header className="col-span-3 flex h-11 items-center gap-3 border-b border-[#DAF5EE] bg-white px-3 text-[#172A3A] dark:border-[#004346]/70 dark:bg-[#080C0E] dark:text-[#F2FBF9] transition-colors">
      <Link
        href="/projects"
        aria-label="Back to projects"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#004346] hover:bg-[#DAF5EE] hover:text-[#172A3A] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#DAF5EE] dark:hover:bg-[#004346] dark:hover:text-[#F2FBF9] transition-colors"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        <span>Projects</span>
      </Link>
      <span className="text-[#DAF5EE] dark:text-[#004346]" aria-hidden>/</span>
      <Link href="/" className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#09BC8A]">
        <Image
          src="/logos/Clairity_Black.svg"
          alt="Clairity"
          width={88}
          height={18}
          priority
          className="h-4.5 w-auto dark:hidden"
        />
        <Image
          src="/logos/Clairity_White.svg"
          alt="Clairity"
          width={88}
          height={18}
          priority
          className="hidden h-4.5 w-auto dark:block"
        />
      </Link>
      {file && <span className="font-mono text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">{file}</span>}
      <span className="ml-auto flex items-center gap-1.5 text-xs text-[#004346] dark:text-[#DAF5EE]" role="status">
        <span
          aria-hidden
          className={`size-2 rounded-full ${connection === "connected" ? "bg-[#09BC8A]" : "animate-pulse bg-[#004346]"}`}
        />
        {{ connected: "Connected", connecting: "Connecting…", disconnected: "Reconnecting…" }[connection]}
        <span className="rounded bg-[#DAF5EE] px-1.5 py-0.5 text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">{extension === "fake" ? "Fake extension" : "Live session"}</span>
      </span>
      <ToggleGroup.Root
        type="single"
        value={view}
        // Radix sends "" when the active item is clicked again; keep the current view instead.
        onValueChange={(v) => v && onViewChange(v as View)}
        aria-label="Canvas view"
        className="flex rounded-md bg-[#DAF5EE]/50 p-0.5 dark:bg-[#172A3A] dark:border dark:border-[#004346]/60 transition-colors"
      >
        {(devServerUrl ? (["visual", "live", "code"] as const) : (["visual", "code"] as const)).map((v) => (
          <ToggleGroup.Item
            key={v}
            value={v}
            className="rounded px-2.5 py-1 text-xs capitalize text-[#004346]/80 focus-visible:outline-2 focus-visible:outline-[#09BC8A] data-[state=on]:bg-white data-[state=on]:text-[#172A3A] data-[state=on]:shadow-xs dark:text-[#DAF5EE]/70 dark:data-[state=on]:bg-[#09BC8A] dark:data-[state=on]:text-[#080C0E] dark:data-[state=on]:font-semibold transition-colors"
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
        className="grid size-8 place-items-center rounded-md text-[#004346] hover:bg-[#DAF5EE] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#DAF5EE] dark:hover:bg-[#004346] transition-colors"
      >
        <Image
          src="/logos/GitHub_Invertocat_Black.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 dark:hidden"
          aria-hidden
        />
        <Image
          src="/logos/GitHub_Invertocat_White.svg"
          alt=""
          width={16}
          height={16}
          className="hidden size-4 dark:block"
          aria-hidden
        />
      </a>
      <ThemeToggle />
    </header>
  );
}
