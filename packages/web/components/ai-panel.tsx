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
    <section aria-label="AI panel" className=" flex max-h-[52%] shrink-0 flex-col border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <Sparkles className="size-3.5 text-blue-500" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">AI &amp; Agent</h2>
        <span className="ml-auto rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          nemotron-3-super
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-auto p-3">
        <div className="flex items-center gap-1.5">
          <div className="grid flex-1 grid-cols-2 rounded-md bg-zinc-200/70 p-0.5 text-[11px] dark:bg-zinc-800" role="group" aria-label="AI scope">
            {(["node", "page"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                aria-pressed={scope === s}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium ${
                  scope === s ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-950 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
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
              className="cursor-pointer rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
            className="h-7 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            aria-label="Send prompt"
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-2.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            <Send className="size-3" aria-hidden />
          </button>
        </form>

        {streaming && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 p-2 font-mono text-[11px] text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
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
          <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950" aria-label="Proposed Changes">
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300">{proposal.reasoning}</p>
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
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChange(c.id)}
                        className="size-3.5 rounded border-zinc-300 text-blue-600"
                      />
                      <span className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {c.kind}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
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
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
              >
                <Check className="size-3" aria-hidden /> Accept All
              </button>
              <button
                type="button"
                disabled={accepted.size === 0}
                onClick={() => applyProposal([...accepted])}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Apply ({accepted.size})
              </button>
              <button
                type="button"
                onClick={() => applyProposal([])}
                className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
