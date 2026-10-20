"use client";
import type { IRNode } from "parser";
import { createElement, type MouseEvent, useState } from "react";
import { useSession } from "../data/session-provider";
import { styleToCss } from "../lib/style-to-css";

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

// shortcut: renders the scene graph, not the real page (custom classes and component internals are missing); swap for the dev-server iframe once the extension reports its URL
function PreviewNode({ node }: { node: IRNode }) {
  if (node.type === "text") return node.text;
  const props = { "data-ir-id": node.id, className: node.passthroughClasses?.join(" "), style: styleToCss(node.style) };
  const children = node.children.map((c) => <PreviewNode key={c.id} node={c} />);
  if (node.type === "component")
    return (
      <div {...props} className={`${props.className ?? ""} relative min-h-8 min-w-8 border border-dashed border-violet-400`}>
        <span className="pointer-events-none absolute -top-2 left-1 bg-white px-1 font-mono text-[10px] leading-none text-violet-600">{node.name}</span>
        {children}
      </div>
    );
  // Only class and style are forwarded, so href, handlers and hidden can't change the preview.
  return createElement(node.name, props, VOID_TAGS.has(node.name) ? undefined : children);
}

// One click handler resolves the Node from the DOM's data-ir-id, the same path the dev-server iframe will use (ADR 0001).
const nodeIdAt = (e: MouseEvent) => (e.target as Element).closest("[data-ir-id]")?.getAttribute("data-ir-id") ?? undefined;

export function CanvasPreview() {
  const roots = useSession((s) => s.roots);
  const selectedId = useSession((s) => s.selectedId);
  const select = useSession((s) => s.select);
  const [hoveredId, setHoveredId] = useState<string>();

  return (
    <div className="p-8">
      {/* Ids are hex hashes, so they are safe inside a CSS attribute selector. */}
      <style>{`
        ${hoveredId && hoveredId !== selectedId ? `[data-ir-id="${hoveredId}"] { outline: 1px dashed #3b82f6; outline-offset: 1px; }` : ""}
        ${selectedId ? `[data-ir-id="${selectedId}"] { outline: 2px solid #3b82f6; outline-offset: 1px; }` : ""}
      `}</style>
      <div
        className="mx-auto min-h-96 max-w-5xl cursor-default bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
        onClick={(e) => {
          e.preventDefault();
          const id = nodeIdAt(e);
          if (id) select(id);
        }}
        onMouseOver={(e) => setHoveredId(nodeIdAt(e))}
        onMouseLeave={() => setHoveredId(undefined)}
      >
        {roots.map((n) => (
          <PreviewNode key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}
