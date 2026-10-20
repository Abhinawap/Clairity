"use client";
import { FileCode2 } from "lucide-react";
import { useSession } from "../data/session-provider";
import { selectedNode } from "../data/session";

// Stand-in until the data layer can load source (web-data-layer slice 3); then this becomes Monaco.
export function CodeViewPlaceholder() {
  const node = useSession(selectedNode);
  const s = node?.source;
  return (
    <div className="grid h-full place-items-center p-8 text-center text-zinc-500 dark:text-zinc-400">
      <div className="space-y-2">
        <FileCode2 className="mx-auto size-8" aria-hidden />
        <p className="font-medium text-zinc-700 dark:text-zinc-200">Code view</p>
        {s ? (
          <p className="font-mono text-xs">
            {s.file}:{s.line}:{s.column} → {s.endLine}:{s.endColumn}
          </p>
        ) : (
          <p className="text-xs">Select a layer to see where it lives in source.</p>
        )}
        <p className="text-xs">The source file and its highlighted lines arrive with source loading.</p>
      </div>
    </div>
  );
}
