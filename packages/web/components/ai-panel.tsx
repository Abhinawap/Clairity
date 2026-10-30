"use client";
import { AlertTriangle, Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { Change } from "../data/proposal";
import { useSession } from "../data/session-provider";
import { selectedNode } from "../data/session";

const DEMO_PROMPTS = [
  { label: "Premium hero", scope: "node" as const, prompt: "Make this hero more premium and cinematic" },
  { label: "Mobile responsive", scope: "page" as const, prompt: "Make the page responsive for mobile" },
];

function describeChange(c: Change) {
  switch (c.kind) {
    case "style":
      return `${c.property}: ${c.before ?? "unset"} → ${c.after}`;
    case "text":
      return `"${c.before ?? ""}" → "${c.after}"`;
    case "class":
      return [...c.removed.map((r) => `-${r}`), ...c.added.map((a) => `+${a}`)].join(" ");
    case "insert":
      return `insert ${c.jsx}`;
    case "source":
      return c.description;
  }
}

export function AiPanel() {
  const selected = useSession(selectedNode);
  const root = useSession((s) => s.roots[0]);
  const streaming = useSession((s) => s.streaming);
  const proposal = useSession((s) => s.proposal);
  const lastError = useSession((s) => s.lastError);
  const requestProposal = useSession((s) => s.requestProposal);
  const applyProposal = useSession((s) => s.applyProposal);

  const [scope, setScope] = useState<"node" | "page">("node");
  const [prompt, setPrompt] = useState("");
  // Changes the developer unticked, per Proposal: a new Proposal starts with every Change accepted.
  const [unticked, setUnticked] = useState<{ proposalId?: string; ids: Set<string> }>({ ids: new Set() });
  const accepted = new Set(
    (proposal?.changes ?? []).filter((c) => unticked.proposalId !== proposal?.id || !unticked.ids.has(c.id)).map((c) => c.id),
  );
  // Both scopes ask the model through the store: the selected Node (or the page) and the prompt.
  const submit = (text = prompt, nextScope = scope) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    requestProposal({ scope: nextScope, prompt: trimmed, nodeId: (selected ?? root)?.id });
  };

  const toggleChange = (id: string) =>
    setUnticked((prev) => {
      const ids = new Set(prev.proposalId === proposal?.id ? prev.ids : []);
      if (!ids.delete(id)) ids.add(id);
      return { proposalId: proposal?.id, ids };
    });

  return (
    <section aria-label="AI panel" className="flex max-h-[52%] shrink-0 flex-col border-t border-[#DAF5EE] bg-[#F2FBF9]/60 text-[#172A3A] dark:border-[#004346]/70 dark:bg-[#080C0E] dark:text-[#F2FBF9] transition-colors">
      <div className="flex items-center gap-1.5 border-b border-[#DAF5EE] px-3 py-2 bg-white dark:border-[#004346]/70 dark:bg-[#080C0E] transition-colors">
        <Sparkles className="size-3.5 text-[#09BC8A]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#004346] dark:text-[#DAF5EE]">AI &amp; Agent</h2>
        <span className="ml-auto rounded bg-[#DAF5EE] px-1.5 py-0.5 font-mono text-[10px] text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
          nemotron-3-super
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-auto p-3">
        <div className="flex items-center gap-1.5">
          <div className="grid flex-1 grid-cols-2 rounded-md bg-[#DAF5EE]/60 p-0.5 text-[11px] dark:bg-[#172A3A] dark:border dark:border-[#004346]/60 transition-colors" role="group" aria-label="AI scope">
            {(["node", "page"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                aria-pressed={scope === s}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium transition-colors ${
                  scope === s
                    ? "bg-white text-[#172A3A] shadow-xs dark:bg-[#004346] dark:text-[#F2FBF9]"
                    : "text-[#004346]/70 dark:text-[#DAF5EE]/70"
                }`}
              >
                {s === "node" ? `Node (${selected?.name ?? "root"})` : "Whole Page"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {DEMO_PROMPTS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setScope(preset.scope);
                setPrompt(preset.prompt);
                submit(preset.prompt, preset.scope);
              }}
              className="cursor-pointer rounded-full border border-[#DAF5EE] bg-white px-2 py-0.5 text-[11px] text-[#004346] hover:border-[#09BC8A] hover:text-[#09BC8A] dark:border-[#004346] dark:bg-[#172A3A] dark:text-[#DAF5EE] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-1.5"
        >
          <label className="sr-only" htmlFor="ai-prompt">Prompt</label>
          <input
            id="ai-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a visual or responsive change…"
            className="h-7 min-w-0 flex-1 rounded-md border border-[#DAF5EE] bg-white px-2 text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none dark:border-[#004346] dark:bg-[#172A3A] dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40 transition-colors"
          />
          <button
            type="submit"
            aria-label="Send prompt"
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#09BC8A] px-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#080C0E] transition-colors"
          >
            <Send className="size-3" aria-hidden />
          </button>
        </form>

        {streaming && (
          <div className="flex items-center gap-2 rounded-md border border-[#09BC8A]/40 bg-[#DAF5EE]/60 p-2 font-mono text-[11px] text-[#004346] dark:border-[#09BC8A]/40 dark:bg-[#004346]/40 dark:text-[#DAF5EE] transition-colors">
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            <span className="truncate">{streaming}</span>
          </div>
        )}

        {lastError && !proposal && (
          <p role="alert" className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden /> {lastError}
          </p>
        )}

        {proposal && (
          <div className="space-y-2 rounded-md border border-[#DAF5EE] bg-white p-2.5 text-xs shadow-md dark:border-[#004346] dark:bg-[#172A3A]/80 transition-colors" aria-label="Proposed Changes">
            <p className="text-[11px] text-[#004346]/80 dark:text-[#DAF5EE]/80">{proposal.reasoning}</p>
            {lastError && (
              <p role="alert" className="flex items-start gap-1.5 rounded bg-red-50 px-1.5 py-1 text-[11px] text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden /> {lastError}
              </p>
            )}
            <ul className="space-y-1">
              {proposal.changes.map((c) => {
                const checked = accepted.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-[#F2FBF9] dark:hover:bg-[#004346]/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChange(c.id)}
                        className="size-3.5 rounded border-[#DAF5EE] text-[#09BC8A] focus:ring-[#09BC8A] dark:border-[#004346]"
                      />
                      <span className="rounded bg-[#DAF5EE] px-1 py-0.5 font-mono text-[10px] uppercase font-semibold text-[#004346] dark:bg-[#004346] dark:text-[#DAF5EE]">
                        {c.kind}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#172A3A] dark:text-[#F2FBF9]">
                        {describeChange(c)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => applyProposal(proposal.changes.map((c) => c.id))}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#09BC8A] px-2 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] dark:text-[#080C0E] transition-colors"
              >
                <Check className="size-3" aria-hidden /> Accept All
              </button>
              <button
                type="button"
                disabled={accepted.size === 0}
                onClick={() => applyProposal([...accepted])}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#DAF5EE] px-2 py-1 text-[11px] font-medium text-[#004346] hover:bg-[#DAF5EE] disabled:opacity-40 dark:border-[#004346] dark:text-[#DAF5EE] dark:hover:bg-[#004346] transition-colors"
              >
                Apply ({accepted.size})
              </button>
              <button
                type="button"
                onClick={() => applyProposal([])}
                className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] text-[#004346]/70 hover:bg-[#DAF5EE] dark:text-[#DAF5EE]/60 dark:hover:bg-[#004346] dark:hover:text-[#F2FBF9] transition-colors"
              >
                <X className="size-3" aria-hidden /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
