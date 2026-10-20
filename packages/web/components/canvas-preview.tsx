"use client";
import { Lock, Minus, Monitor, Plus, Smartphone, Tablet, User } from "lucide-react";
import type { IRNode } from "parser";
import { createElement, type MouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { useSession } from "../data/session-provider";
import { selectedNode } from "../data/session";
import { styleToCss } from "../lib/style-to-css";

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%", icon: Monitor },
  { id: "tablet", label: "Tablet", width: "768px", icon: Tablet },
  { id: "mobile", label: "Mobile", width: "375px", icon: Smartphone },
] as const;

type Box = { left: number; top: number; width: number; height: number };
type Handle = "e" | "s" | "se";

// shortcut: renders the scene graph, not the real page; swap for the dev-server iframe once the extension reports its URL
function PreviewNode({ node }: { node: IRNode }) {
  if (node.type === "text") return node.text;
  const css = styleToCss(node.style);
  const props = { "data-ir-id": node.id, className: node.passthroughClasses?.join(" "), style: css };
  const children = node.children.map((c) => <PreviewNode key={c.id} node={c} />);

  if (node.type === "component") {
    if (node.name === "Image") {
      const size = typeof node.props.width === "number" ? `${node.props.width}px` : "32px";
      return (
        <div
          {...props}
          style={{ width: size, height: size, ...css }}
          title={typeof node.props.alt === "string" ? node.props.alt : "Image"}
          className={`${props.className ?? ""} mb-4 inline-flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm ring-2 ring-white`}
        >
          <User className="size-1/2" aria-hidden />
        </div>
      );
    }
    return (
      <div {...props} className={`${props.className ?? ""} relative flex min-h-8 items-center gap-2 rounded border border-dashed border-violet-300 bg-violet-50/40 px-2.5 py-1.5 text-xs text-violet-700`}>
        <span className="font-mono font-medium">&lt;{node.name} /&gt;</span>
        {Object.entries(node.props).map(([k, v]) => (
          <span key={k} className="rounded bg-violet-100 px-1 font-mono text-[10px]">{v === true ? k : `${k}=${v}`}</span>
        ))}
        {children}
      </div>
    );
  }
  return createElement(node.name, props, VOID_TAGS.has(node.name) ? undefined : children);
}

const nodeIdAt = (e: MouseEvent) => (e.target as Element).closest("[data-ir-id]")?.getAttribute("data-ir-id") ?? undefined;

export function CanvasPreview() {
  const roots = useSession((s) => s.roots);
  const selected = useSession(selectedNode);
  const select = useSession((s) => s.select);
  const applyEdit = useSession((s) => s.applyEdit);
  const [hoveredId, setHoveredId] = useState<string>();
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]["id"]>("desktop");
  const [zoom, setZoom] = useState(100);
  const [box, setBox] = useState<Box>();
  const [dragSize, setDragSize] = useState<{ width?: number; height?: number }>();
  const artboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const artboard = artboardRef.current;
    const target = selected ? artboard?.querySelector<HTMLElement>(`[data-ir-id="${selected.id}"]`) : null;
    if (!artboard || !target) return;
    const measure = () => {
      const a = artboard.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const scale = zoom / 100;
      setBox({
        left: (t.left - a.left) / scale,
        top: (t.top - a.top) / scale,
        width: Math.round(t.width / scale),
        height: Math.round(t.height / scale),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(artboard);
    ro.observe(target);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [selected, roots, viewport, zoom]);

  const startResize = (handle: Handle, e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selected?.editable || !box) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = box.width;
    const startH = box.height;
    const scale = zoom / 100;
    let next: { width?: number; height?: number } = {};

    const onMove = (ev: PointerEvent) => {
      const dw = Math.max(16, Math.round(startW + (ev.clientX - startX) / scale));
      const dh = Math.max(16, Math.round(startH + (ev.clientY - startY) / scale));
      next = {
        ...(handle !== "s" ? { width: dw } : {}),
        ...(handle !== "e" ? { height: dh } : {}),
      };
      setDragSize(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragSize(undefined);
      const style = {
        ...(next.width !== undefined ? { width: `${next.width}px` } : {}),
        ...(next.height !== undefined ? { height: `${next.height}px` } : {}),
      };
      if (Object.keys(style).length > 0) applyEdit(selected.id, style);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const shownBox = selected && selected.type !== "text" && box
    ? { ...box, width: dragSize?.width ?? box.width, height: dragSize?.height ?? box.height }
    : undefined;
  const activeViewport = VIEWPORTS.find((v) => v.id === viewport)!;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800" role="group" aria-label="Viewport preset">
          {VIEWPORTS.map((vp) => {
            const Icon = vp.icon;
            const active = vp.id === viewport;
            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => setViewport(vp.id)}
                aria-label={vp.label}
                aria-pressed={active}
                className={`flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[11px] ${
                  active ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-950 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="size-3" aria-hidden />
                <span>{vp.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 px-1 py-0.5 dark:border-zinc-800">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="grid size-5 cursor-pointer place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Minus className="size-3" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={() => setZoom(100)}
            className="w-11 cursor-pointer text-center font-mono text-[11px] text-zinc-600 dark:text-zinc-300"
          >
            {zoom}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(150, z + 25))}
            className="grid size-5 cursor-pointer place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Plus className="size-3" aria-hidden />
          </button>
        </div>

        {selected && (
          <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">{selected.type === "text" ? "#text" : `<${selected.name}>`}</span>
            {shownBox && <span>{shownBox.width} × {shownBox.height}</span>}
            {!selected.editable && (
              <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-sans text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Lock className="size-3" aria-hidden /> Read-only
              </span>
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <style>{`
          ${hoveredId && hoveredId !== selected?.id ? `[data-ir-id="${hoveredId}"] { outline: 1px dashed #3b82f6; outline-offset: 1px; }` : ""}
          ${selected && dragSize ? `[data-ir-id="${selected.id}"] { ${dragSize.width ? `width: ${dragSize.width}px !important;` : ""} ${dragSize.height ? `height: ${dragSize.height}px !important;` : ""} }` : ""}
        `}</style>
        <div
          ref={artboardRef}
          data-canvas-artboard
          style={{
            width: activeViewport.width,
            maxWidth: activeViewport.id === "desktop" ? "64rem" : activeViewport.width,
            transform: zoom === 100 ? undefined : `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
          className="relative mx-auto min-h-96 cursor-default rounded-md bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition-[width] duration-150 dark:ring-zinc-700"
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

          {selected && shownBox && (
            <div
              data-selection-overlay
              style={{ left: shownBox.left, top: shownBox.top, width: shownBox.width, height: shownBox.height }}
              className={`pointer-events-none absolute z-10 border-2 ${selected.editable ? "border-blue-500" : "border-amber-500"}`}
            >
              <span
                className={`absolute -top-5 left-0 flex items-center gap-1 rounded-t px-1.5 py-0.5 font-mono text-[10px] leading-none text-white ${
                  selected.editable ? "bg-blue-500" : "bg-amber-500"
                }`}
              >
                {!selected.editable && <Lock className="size-2.5" aria-hidden />}
                {selected.name} · {shownBox.width}×{shownBox.height}
              </span>
              {selected.editable && (
                <>
                  <button
                    type="button"
                    aria-label="Resize width"
                    onPointerDown={(e) => startResize("e", e)}
                    className="pointer-events-auto absolute top-1/2 -right-1.5 size-2.5 -translate-y-1/2 cursor-ew-resize rounded-xs border border-white bg-blue-500 shadow-xs"
                  />
                  <button
                    type="button"
                    aria-label="Resize height"
                    onPointerDown={(e) => startResize("s", e)}
                    className="pointer-events-auto absolute -bottom-1.5 left-1/2 size-2.5 -translate-x-1/2 cursor-ns-resize rounded-xs border border-white bg-blue-500 shadow-xs"
                  />
                  <button
                    type="button"
                    aria-label="Resize width and height"
                    onPointerDown={(e) => startResize("se", e)}
                    className="pointer-events-auto absolute -right-1.5 -bottom-1.5 size-2.5 cursor-nwse-resize rounded-xs border border-white bg-blue-500 shadow-xs"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
