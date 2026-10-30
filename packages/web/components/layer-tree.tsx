"use client";
import { ChevronRight, Code2, Component, Lock, Type } from "lucide-react";
import type { IRNode } from "parser";
import { Tooltip } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { useSession } from "../data/session-provider";

// Ids of the Nodes above `id`, outermost first; empty if `id` is a root or not in the tree.
function ancestors(nodes: IRNode[], id: string, path: string[] = []): string[] | undefined {
  for (const n of nodes) {
    if (n.id === id) return path;
    const found = ancestors(n.children, id, [...path, n.id]);
    if (found) return found;
  }
}

const icons = { element: Code2, component: Component, text: Type };

export function LayerTree() {
  const roots = useSession((s) => s.roots);
  const selectedId = useSession((s) => s.selectedId);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // A selection from the canvas expands its ancestors so its row is visible (adjusted during render, not in an effect).
  const [shownSelection, setShownSelection] = useState(selectedId);
  if (selectedId !== shownSelection) {
    setShownSelection(selectedId);
    const path = selectedId ? ancestors(roots, selectedId) : undefined;
    if (path?.some((id) => collapsed.has(id))) setCollapsed(new Set([...collapsed].filter((id) => !path.includes(id))));
  }
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="py-2">
      <h2 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-[#004346]/80 dark:text-[#DAF5EE]/80">Layers</h2>
      <ul>
        {roots.map((n) => (
          <TreeRow key={n.id} node={n} depth={0} collapsed={collapsed} onToggle={toggle} />
        ))}
      </ul>
    </div>
  );
}

function TreeRow({ node, depth, collapsed, onToggle }: { node: IRNode; depth: number; collapsed: Set<string>; onToggle(id: string): void }) {
  const selected = useSession((s) => s.selectedId === node.id);
  const select = useSession((s) => s.select);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) row.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const open = !collapsed.has(node.id);
  const Icon = icons[node.type];
  const label = node.type === "text" ? `"${node.text}"` : node.name;

  return (
    <li>
      <div
        ref={row}
        style={{ paddingLeft: depth * 12 + 4 }}
        className={`flex h-7 items-center gap-1 pr-2 transition-colors ${selected ? "bg-[#DAF5EE] text-[#004346] font-medium dark:bg-[#004346] dark:text-[#F2FBF9]" : "hover:bg-[#F2FBF9] dark:hover:bg-[#004346]/40"}`}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
            aria-expanded={open}
            className="grid size-5 shrink-0 place-items-center rounded text-[#004346]/50 hover:text-[#004346] focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#DAF5EE]/50 dark:hover:text-[#DAF5EE]"
          >
            <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => select(node.id)}
          aria-current={selected || undefined}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded text-left focus-visible:outline-2 focus-visible:outline-[#09BC8A]"
        >
          <Icon className={`size-3.5 shrink-0 ${node.type === "component" ? "text-[#09BC8A]" : "text-[#004346]/50 dark:text-[#DAF5EE]/50"}`} aria-hidden />
          <span className={`truncate ${node.type === "text" ? "text-[#004346]/70 dark:text-[#DAF5EE]/70" : "font-mono text-xs"}`}>{label}</span>
        </button>
        {!node.editable && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span tabIndex={0} aria-label={`Read-only: ${node.reason}`} className="shrink-0 rounded text-amber-600 focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-amber-400">
                <Lock className="size-3" aria-hidden />
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" sideOffset={6} className="max-w-56 rounded-md bg-[#172A3A] px-2 py-1 text-xs text-[#F2FBF9] shadow-md border border-[#004346] dark:bg-[#DAF5EE] dark:text-[#172A3A]">
                Read-only: {node.reason}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>
      {open && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeRow key={c.id} node={c} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}
