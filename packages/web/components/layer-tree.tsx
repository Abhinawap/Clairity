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
      <h2 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Layers</h2>
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
        className={`flex h-7 items-center gap-1 pr-2 ${selected ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"}`}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
            aria-expanded={open}
            className="grid size-5 shrink-0 place-items-center rounded text-zinc-400 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:text-zinc-200"
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
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded text-left focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Icon className={`size-3.5 shrink-0 ${node.type === "component" ? "text-violet-500" : "text-zinc-400"}`} aria-hidden />
          <span className={`truncate ${node.type === "text" ? "text-zinc-500 dark:text-zinc-400" : "font-mono text-xs"}`}>{label}</span>
        </button>
        {!node.editable && (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span tabIndex={0} aria-label={`Read-only: ${node.reason}`} className="shrink-0 rounded text-amber-600 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-amber-400">
                <Lock className="size-3" aria-hidden />
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" sideOffset={6} className="max-w-56 rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900">
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
