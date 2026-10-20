"use client";
import { ChevronRight, Lock, MousePointerClick } from "lucide-react";
import type { IRNode } from "parser";
import { Collapsible } from "radix-ui";
import type { ReactNode } from "react";
import { useSession } from "../data/session-provider";
import { selectedNode, textRuns } from "../data/session";
import { StyleField } from "./style-field";

type Style = IRNode["style"];
type StringProp = "width" | "height" | "borderRadius" | "backgroundColor" | "color" | "fontSize" | "fontWeight";
const SIDES = ["top", "right", "bottom", "left"] as const;
// Preflight zeroes padding and margin, so a side never set is 0.
const ZERO_BOX = { top: "0", right: "0", bottom: "0", left: "0" };

export function Inspector() {
  const node = useSession(selectedNode);
  const applyEdit = useSession((s) => s.applyEdit);
  const applyText = useSession((s) => s.applyText);

  if (!node)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="space-y-2">
          <MousePointerClick className="mx-auto size-6" aria-hidden />
          <p>Select a layer on the canvas or in the layer tree.</p>
        </div>
      </div>
    );

  const disabled = !node.editable;
  const edit = (style: Partial<Style>) => applyEdit(node.id, style);
  // Keyed on the confirmed value, so a patch from the extension resets the field's draft.
  const field = (prop: StringProp, label: string, color?: boolean) => (
    <StyleField key={`${node.id}:${prop}:${node.style[prop]}`} label={label} value={node.style[prop]} color={color} disabled={disabled} onCommit={(v) => edit({ [prop]: v })} />
  );
  const box = (prop: "padding" | "margin") => {
    const current = node.style[prop] ?? ZERO_BOX;
    return SIDES.map((side) => (
      <StyleField
        key={`${node.id}:${prop}:${side}:${current[side]}`}
        label={side[0].toUpperCase() + side.slice(1)}
        value={current[side]}
        disabled={disabled}
        // The Edit carries the whole box, so only the one side changes.
        onCommit={(v) => edit({ [prop]: { ...current, [side]: v } })}
      />
    ));
  };
  const runs = textRuns(node);

  return (
    <div className="pb-4">
      <header className="space-y-1 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <p className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{node.type === "text" ? "Text run" : node.name}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{node.type}</span>
        </p>
        <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
          {node.source.file}:{node.source.line}
        </p>
      </header>

      {disabled && node.type !== "text" && (
        <p className="m-3 flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            <strong>Read-only:</strong> {node.reason}. Its style can&apos;t be edited; its text runs still can.
          </span>
        </p>
      )}

      {node.type !== "text" && (
        <>
          <Section title="Layout">
            {field("width", "Width")}
            {field("height", "Height")}
          </Section>
          <Section title="Padding">{box("padding")}</Section>
          <Section title="Margin">{box("margin")}</Section>
          <Section title="Border">{field("borderRadius", "Radius")}</Section>
          <Section title="Fill">{field("backgroundColor", "Background", true)}</Section>
          <Section title="Typography">
            {field("color", "Color", true)}
            {field("fontSize", "Size")}
            {field("fontWeight", "Weight")}
          </Section>
        </>
      )}

      {runs.length > 0 && (
        <Section title="Content">
          {runs.map((run, i) => (
            <StyleField
              key={`${run.id}:${run.text}`}
              label={runs.length > 1 ? `Text ${i + 1}` : "Text"}
              value={run.text}
              disabled={!run.editable}
              onCommit={(v) => applyText(run.id, v)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible.Root defaultOpen className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <Collapsible.Trigger className="group flex w-full items-center gap-1 rounded py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400">
        <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
        {title}
      </Collapsible.Trigger>
      <Collapsible.Content className="space-y-1.5 pt-1">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
