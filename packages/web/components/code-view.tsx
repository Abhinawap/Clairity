"use client";
import { FileCode2, Lock } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSession } from "../data/session-provider";
import { selectedNode } from "../data/session";

// shortcut: reads the server-passed fixture map until source:read lands in the data layer (web-data-layer slice 3)
export function CodeView({ sources }: { sources: Record<string, string> }) {
  const node = useSession(selectedNode);
  const rootFile = useSession((s) => s.roots[0]?.source.file);
  const file = node?.source.file ?? rootFile;
  const lines = (file ? sources[file] : undefined)?.replace(/\r\n/g, "\n").split("\n") ?? [];
  const firstHighlighted = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    firstHighlighted.current?.scrollIntoView({ block: "center" });
  }, [node?.id]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#172A3A]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#DAF5EE] px-3 text-xs dark:border-[#004346]">
        <FileCode2 className="size-3.5 text-[#004346]/60 dark:text-[#DAF5EE]/60" aria-hidden />
        <span className="font-mono font-medium text-[#172A3A] dark:text-[#F2FBF9]">{file ?? "No file"}</span>
        <span className="text-[#004346]/50 dark:text-[#DAF5EE]/50">· {lines.length} lines</span>
        {node && (
          <span className="ml-auto flex items-center gap-2 font-mono">
            <span className="rounded bg-[#DAF5EE] px-1.5 py-0.5 text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
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
                  className={hit ? "bg-[#DAF5EE]/60 dark:bg-[#004346]/40" : "hover:bg-[#F2FBF9] dark:hover:bg-[#004346]/20"}
                >
                  <td
                    className={`w-12 select-none border-l-2 pr-3 text-right text-[11px] ${
                      hit ? "border-[#09BC8A] font-semibold text-[#004346] dark:text-[#09BC8A]" : "border-transparent text-[#004346]/40 dark:text-[#DAF5EE]/40"
                    }`}
                  >
                    {line}
                  </td>
                  <td className="whitespace-pre pr-4 text-[#172A3A] dark:text-[#F2FBF9]">{text || " "}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
