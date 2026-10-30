"use client";
import { FileCode2, Lock } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSession } from "../data/session-provider";
import { selectedNode } from "../data/session";

export function CodeView() {
  const node = useSession(selectedNode);
  const rootFile = useSession((s) => s.roots[0]?.source.file);
  const file = node?.source.file ?? rootFile;
  const content = useSession((s) => (file ? s.sources[file] : undefined));
  const readSource = useSession((s) => s.readSource);
  const lines = content?.replace(/\r\n/g, "\n").split("\n") ?? [];
  const firstHighlighted = useRef<HTMLTableRowElement>(null);

  // Asks the extension for a file the store doesn't hold yet; it lands in the store and this view re-renders.
  useEffect(() => {
    if (file && content === undefined) readSource(file);
  }, [file, content, readSource]);

  useEffect(() => {
    firstHighlighted.current?.scrollIntoView({ block: "center" });
  }, [node?.id, content]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 text-xs dark:border-zinc-800">
        <FileCode2 className="size-3.5 text-zinc-400" aria-hidden />
        <span className="font-mono font-medium">{file ?? "No file"}</span>
        <span className="text-zinc-400">· {lines.length} lines</span>
        {node && (
          <span className="ml-auto flex items-center gap-2 font-mono">
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {node.type === "text" ? "#text" : `<${node.name}>`} L{node.source.line}:{node.source.column}→L{node.source.endLine}:{node.source.endColumn}
            </span>
            {!node.editable && (
              <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-sans text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Lock className="size-3" aria-hidden /> Read-only
              </span>
            )}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-2 font-mono text-xs leading-5">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((text, idx) => {
              const line = idx + 1;
              const hit = node && line >= node.source.line && line <= node.source.endLine;
              return (
                <tr
                  key={line}
                  ref={hit && line === node.source.line ? firstHighlighted : undefined}
                  data-highlighted={hit || undefined}
                  className={hit ? "bg-blue-50/90 dark:bg-blue-950/60" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"}
                >
                  <td
                    className={`w-12 select-none border-l-2 pr-3 text-right text-[11px] ${
                      hit ? "border-blue-500 font-semibold text-blue-600 dark:text-blue-400" : "border-transparent text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {line}
                  </td>
                  <td className="whitespace-pre pr-4 text-zinc-800 dark:text-zinc-200">{text || " "}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
