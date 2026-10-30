"use client";
import { ChevronRight, Lock, MousePointerClick } from "lucide-react";
import type { IRNode } from "parser";
import { Collapsible } from "radix-ui";
import type { ReactNode } from "react";
import { useSession } from "../data/session-provider";
import { selectedNode, textRuns } from "../data/session";
import { StyleField } from "./style-field";

type Style = IRNode["style"];
type StringProp = Exclude<keyof Style, "padding" | "margin">;
const SIDES = ["top", "right", "bottom", "left"] as const;
const DISPLAYS = ["block", "flex", "inline-flex", "grid"] as const;
const SWATCHES = ["#172A3A", "#004346", "#09BC8A", "#DAF5EE", "#F2FBF9"] as const;
// Preflight zeroes padding and margin, so a side never set is 0.
const ZERO_BOX = { top: "0", right: "0", bottom: "0", left: "0" };

export function Inspector() {
  const node = useSession(selectedNode);
  const applyEdit = useSession((s) => s.applyEdit);
  const applyText = useSession((s) => s.applyText);

  if (!node)
    return (
      <div className="grid h-full place-items-center p-6 text-center text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">
        <div className="space-y-2">
          <MousePointerClick className="mx-auto size-6 text-[#09BC8A]" aria-hidden />
          <p>Select a layer on the canvas or in the layer tree.</p>
        </div>
      </div>
    );

  const disabled = !node.editable;
  const edit = (style: Partial<Style>) => applyEdit(node.id, style);
  // Keyed on the confirmed value, so a patch from the extension resets the field's draft.
  const field = (prop: StringProp, label: string, opts?: { color?: boolean; compact?: boolean; placeholder?: string }) => (
    <StyleField
      key={`${node.id}:${prop}:${node.style[prop]}`}
      label={label}
      value={node.style[prop]}
      color={opts?.color}
      compact={opts?.compact}
      placeholder={opts?.placeholder}
      disabled={disabled}
      onCommit={(v) => edit({ [prop]: v })}
    />
  );
  const box = (prop: "padding" | "margin") => {
    const current = node.style[prop] ?? ZERO_BOX;
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {SIDES.map((side) => (
          <StyleField
            key={`${node.id}:${prop}:${side}:${current[side]}`}
            label={side[0].toUpperCase() + side.slice(1)}
            value={current[side]}
            compact
            disabled={disabled}
            // The Edit carries the whole box, so only the one side changes.
            onCommit={(v) => edit({ [prop]: { ...current, [side]: v } })}
          />
        ))}
      </div>
    );
  };
  const runs = textRuns(node);
  const propEntries = Object.entries(node.props);
  const passthrough = node.passthroughClasses ?? [];

  return (
    <div className="pb-4">
      <header className="space-y-1.5 border-b border-[#DAF5EE] p-3 dark:border-[#004346]">
        <p className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-[#172A3A] dark:text-[#F2FBF9]">{node.type === "text" ? "Text run" : node.name}</span>
          <span className="rounded bg-[#DAF5EE] px-1.5 py-0.5 text-[10px] uppercase font-semibold text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">{node.type}</span>
          <span className="ml-auto font-mono text-[11px] text-[#004346]/60 dark:text-[#DAF5EE]/60">
            {node.source.file}:{node.source.line}
          </span>
        </p>
        {propEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {propEntries.map(([k, v]) => (
              <span key={k} className="rounded bg-[#DAF5EE] px-1.5 py-0.5 font-mono text-[10px] text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
                {v === true ? k : `${k}=${JSON.stringify(v)}`}
              </span>
            ))}
          </div>
        )}
        {passthrough.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5" aria-label="Passthrough classes">
            <span className="text-[10px] text-[#004346]/60 dark:text-[#DAF5EE]/60">Passthrough:</span>
            {passthrough.map((cls) => (
              <span key={cls} className="rounded bg-[#F2FBF9] px-1.5 py-0.5 font-mono text-[10px] text-[#004346] dark:bg-[#004346]/50 dark:text-[#DAF5EE]">
                {cls}
              </span>
            ))}
          </div>
        )}
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
            <div className="grid grid-cols-2 gap-1.5">
              {field("width", "Width", { compact: true, placeholder: "auto" })}
              {field("height", "Height", { compact: true, placeholder: "auto" })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-11 shrink-0 text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70">Display</span>
              <div className="grid flex-1 grid-cols-4 gap-1 rounded-md bg-[#DAF5EE]/50 p-0.5 dark:bg-[#004346]/40">
                {DISPLAYS.map((d) => {
                  const active = node.style.display === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={disabled}
                      onClick={() => edit({ display: d })}
                      aria-pressed={active}
                      className={`cursor-pointer truncate rounded px-1 py-0.5 font-mono text-[10px] disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                        active ? "bg-white text-[#172A3A] shadow-xs dark:bg-[#004346] dark:text-[#F2FBF9]" : "text-[#004346]/70 hover:text-[#172A3A] dark:text-[#DAF5EE]/70 dark:hover:text-[#F2FBF9]"
                      }`}
                    >
                      {d === "inline-flex" ? "in-flex" : d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {field("alignItems", "Align", { compact: true, placeholder: "center" })}
              {field("justifyContent", "Justify", { compact: true, placeholder: "between" })}
            </div>
            {field("gap", "Gap", { compact: true, placeholder: "0px" })}
          </Section>
          <Section title="Padding">{box("padding")}</Section>
          <Section title="Margin">{box("margin")}</Section>
          <Section title="Border">
            <div className="grid grid-cols-2 gap-1.5">
              {field("borderRadius", "Radius", { compact: true, placeholder: "0px" })}
              {field("opacity", "Opacity", { compact: true, placeholder: "1" })}
            </div>
            {field("border", "Border", { compact: true, placeholder: "1px solid" })}
            {field("boxShadow", "Shadow", { compact: true, placeholder: "none" })}
          </Section>
          <Section title="Fill">
            {field("backgroundColor", "Background", { color: true, placeholder: "transparent" })}
            <Swatches disabled={disabled} onPick={(hex) => edit({ backgroundColor: hex })} />
          </Section>
          <Section title="Typography">
            {field("color", "Color", { color: true, placeholder: "inherit" })}
            <Swatches disabled={disabled} onPick={(hex) => edit({ color: hex })} />
            <div className="grid grid-cols-2 gap-1.5">
              {field("fontSize", "Size", { compact: true, placeholder: "1rem" })}
              {field("fontWeight", "Weight", { compact: true, placeholder: "400" })}
            </div>
            {field("lineHeight", "Line", { compact: true, placeholder: "1.5" })}
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

function Swatches({ disabled, onPick }: { disabled?: boolean; onPick(hex: string): void }) {
  return (
    <div className="flex items-center gap-1 pl-21.5">
      {SWATCHES.map((hex) => (
        <button
          key={hex}
          type="button"
          disabled={disabled}
          aria-label={`Apply ${hex}`}
          onClick={() => onPick(hex)}
          style={{ backgroundColor: hex }}
          className="size-4 cursor-pointer rounded-full border border-[#004346]/30 disabled:cursor-not-allowed disabled:opacity-40 hover:scale-110 transition-transform"
        />
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible.Root defaultOpen className="border-b border-[#DAF5EE] px-3 py-2 dark:border-[#004346]">
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-center gap-1 rounded py-1 text-xs font-semibold uppercase tracking-wide text-[#004346]/80 focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#DAF5EE]/80">
        <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
        {title}
      </Collapsible.Trigger>
      <Collapsible.Content className="space-y-1.5 pt-1">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
