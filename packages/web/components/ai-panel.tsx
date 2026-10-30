"use client";
import { AlertTriangle, Check, CheckCircle2, Loader2, Send, Sparkles, Square, X } from "lucide-react";
import type { IRNode } from "parser";
import { useEffect, useRef, useState } from "react";
import type { Change, Proposal } from "../data/proposal";
import type { AgentStepMessage } from "../data/protocol";
import { useSession } from "../data/session-provider";
import { selectedNode, textRuns } from "../data/session";

const DEMO_PROMPTS = [
  { label: "Premium hero", scope: "node" as const, prompt: "Make this hero more premium and cinematic" },
  { label: "Mobile responsive (Agent)", scope: "page" as const, prompt: "Make the page responsive for mobile" },
];

function buildProposal(prompt: string, scope: "node" | "page", target: IRNode | undefined): Proposal {
  const nodeId = target?.id ?? "root";
  const runs = textRuns(target);
  const changes: (Change & { id: string })[] = [
    {
      id: "c_1",
      kind: "style",
      nodeId,
      property: "color",
      before: target?.style.color,
      after: "#09BC8A",
    },
    {
      id: "c_2",
      kind: "style",
      nodeId,
      property: "fontSize",
      before: target?.style.fontSize,
      after: "3.5rem",
    },
  ];
  if (runs[0]) {
    changes.push({
      id: "c_3",
      kind: "text",
      nodeId: runs[0].id,
      before: runs[0].text,
      after: "The visual frontend tool you're",
    });
  }
  changes.push({
    id: "c_4",
    kind: "class",
    nodeId,
    added: ["tracking-tight", "sm:text-5xl"],
    removed: [],
  });
  return {
    id: "prop_1",
    intent: prompt,
    scope,
    reasoning: "Refined typography hierarchy, tightened letter-spacing, and updated hero copy for a more editorial feel.",
    changes,
  };
}

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

// shortcut: drives streaming Proposals and the build-fix-render loop from local timers until slices 5–6 land in data/
export function AiPanel() {
  const selected = useSession(selectedNode);
  const root = useSession((s) => s.roots[0]);
  const applyEdit = useSession((s) => s.applyEdit);
  const applyText = useSession((s) => s.applyText);

  const [scope, setScope] = useState<"node" | "page">("node");
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState<string>();
  const [proposal, setProposal] = useState<Proposal>();
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [steps, setSteps] = useState<AgentStepMessage[]>([]);
  const [runningAgent, setRunningAgent] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const submit = (text = prompt, nextScope = scope) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    clearTimers();
    setProposal(undefined);
    setAccepted(new Set());
    setSteps([]);

    const isAgent = trimmed.toLowerCase().includes("agent") || trimmed.toLowerCase().includes("responsive");
    if (isAgent) {
      runAgentLoop(trimmed);
      return;
    }

    const chunks = [
      "Analyzing component…",
      "Drafting proposal: tighter typography and updated accent…",
      "Formatting reviewable diff…",
    ];
    let i = 0;
    const tick = () => {
      if (i < chunks.length) {
        setStreaming(chunks[i++]);
        timers.current.push(setTimeout(tick, 250));
      } else {
        setStreaming(undefined);
        const p = buildProposal(trimmed, nextScope, nextScope === "node" ? selected : root);
        setProposal(p);
        setAccepted(new Set(p.changes.map((c) => c.id)));
      }
    };
    tick();
  };

  const runAgentLoop = (intent: string) => {
    setRunningAgent(true);
    const plan: AgentStepMessage[] = [
      { type: "agent:step", step: 1, description: "Scan viewport constraints across breakpoints", status: "running" },
      { type: "agent:step", step: 2, description: "Run `next build` to verify type and layout safety", status: "ok" },
      { type: "agent:step", step: 3, description: "Capture render screenshot and compute visual diff", status: "ok" },
      { type: "agent:step", step: 4, description: "Emit minimal proposal against source AST", status: "ok" },
    ];

    let current = 0;
    const advance = () => {
      if (current >= plan.length) {
        setRunningAgent(false);
        const p = buildProposal(intent, "page", root);
        setProposal(p);
        setAccepted(new Set(p.changes.map((c) => c.id)));
        return;
      }
      setSteps(plan.slice(0, current + 1).map((s, idx) => ({
        ...s,
        status: idx === current ? "running" : "ok",
      })));
      current++;
      timers.current.push(setTimeout(advance, 400));
    };
    advance();
  };

  const stopAgent = () => {
    clearTimers();
    setRunningAgent(false);
    setStreaming(undefined);
  };

  const applyChanges = (ids: Set<string>) => {
    if (!proposal) return;
    for (const c of proposal.changes) {
      if (!ids.has(c.id)) continue;
      if (c.kind === "style") applyEdit(c.nodeId, { [c.property]: c.after });
      if (c.kind === "text") applyText(c.nodeId, c.after);
    }
    setProposal(undefined);
  };

  const toggleChange = (id: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <section aria-label="AI panel" className="flex max-h-[52%] shrink-0 flex-col border-t border-[#004346]/70 bg-[#080C0E] text-[#F2FBF9]">
      <div className="flex items-center gap-1.5 border-b border-[#004346]/70 px-3 py-2 bg-[#080C0E]">
        <Sparkles className="size-3.5 text-[#09BC8A]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#DAF5EE]">AI &amp; Agent</h2>
        <span className="ml-auto rounded bg-[#004346] px-1.5 py-0.5 font-mono text-[10px] text-[#DAF5EE]">
          nemotron-3-super
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-auto p-3 bg-[#080C0E]">
        <div className="flex items-center gap-1.5">
          <div className="grid flex-1 grid-cols-2 rounded-md bg-[#172A3A] p-0.5 text-[11px] border border-[#004346]/60" role="group" aria-label="AI scope">
            {(["node", "page"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                aria-pressed={scope === s}
                className={`cursor-pointer rounded px-2 py-0.5 font-medium transition-colors ${
                  scope === s ? "bg-[#004346] text-[#F2FBF9] shadow-xs" : "text-[#DAF5EE]/70 hover:text-[#F2FBF9]"
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
              className="cursor-pointer rounded-full border border-[#004346] bg-[#172A3A] px-2 py-0.5 text-[11px] text-[#DAF5EE] hover:border-[#09BC8A] hover:text-[#09BC8A] transition-colors"
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
            className="h-7 min-w-0 flex-1 rounded-md border border-[#004346] bg-[#172A3A] px-2 text-xs text-[#F2FBF9] placeholder:text-[#DAF5EE]/40 focus:border-[#09BC8A] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send prompt"
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#09BC8A] px-2.5 text-xs font-semibold text-[#080C0E] shadow-sm hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
          >
            <Send className="size-3" aria-hidden />
          </button>
        </form>

        {streaming && (
          <div className="flex items-center gap-2 rounded-md border border-[#09BC8A]/40 bg-[#004346]/40 p-2 font-mono text-[11px] text-[#DAF5EE]">
            <Loader2 className="size-3.5 shrink-0 animate-spin text-[#09BC8A]" aria-hidden />
            <span className="truncate">{streaming}</span>
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-[#004346] bg-[#172A3A] p-2 text-xs" aria-label="Agent build loop">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#DAF5EE]">Build → Fix → Render Loop</span>
              {runningAgent && (
                <button
                  type="button"
                  onClick={stopAgent}
                  className="inline-flex cursor-pointer items-center gap-1 rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-medium text-red-300 border border-red-800"
                >
                  <Square className="size-2.5 fill-current" aria-hidden /> Stop
                </button>
              )}
            </div>
            <ul className="space-y-1">
              {steps.map((s) => (
                <li key={s.step} className="flex items-start gap-1.5 text-[11px]">
                  {s.status === "running" && <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-[#09BC8A]" aria-hidden />}
                  {s.status === "ok" && <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-[#09BC8A]" aria-hidden />}
                  {s.status === "error" && <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-400" aria-hidden />}
                  <span className={s.status === "error" ? "font-mono text-amber-300" : "text-[#DAF5EE]/80"}>
                    {s.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {proposal && (
          <div className="space-y-2 rounded-md border border-[#004346] bg-[#172A3A] p-2.5 text-xs shadow-lg" aria-label="Proposed Changes">
            <p className="text-[11px] text-[#DAF5EE]/80">{proposal.reasoning}</p>
            <ul className="space-y-1">
              {proposal.changes.map((c) => {
                const checked = accepted.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-[#004346]/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChange(c.id)}
                        className="size-3.5 rounded border-[#004346] text-[#09BC8A] focus:ring-[#09BC8A]"
                      />
                      <span className="rounded bg-[#004346] px-1 py-0.5 font-mono text-[10px] uppercase font-semibold text-[#DAF5EE]">
                        {c.kind}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#F2FBF9]">
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
                onClick={() => applyChanges(new Set(proposal.changes.map((c) => c.id)))}
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#09BC8A] px-2 py-1 text-[11px] font-semibold text-[#080C0E] shadow-sm hover:bg-[#09BC8A]/90 focus-visible:outline-2 focus-visible:outline-[#09BC8A] transition-colors"
              >
                <Check className="size-3" aria-hidden /> Accept All
              </button>
              <button
                type="button"
                disabled={accepted.size === 0}
                onClick={() => applyChanges(accepted)}
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#004346] px-2 py-1 text-[11px] font-medium text-[#DAF5EE] hover:bg-[#004346] disabled:opacity-40 transition-colors"
              >
                Apply ({accepted.size})
              </button>
              <button
                type="button"
                onClick={() => setProposal(undefined)}
                className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] text-[#DAF5EE]/60 hover:bg-[#004346] hover:text-[#F2FBF9] transition-colors"
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
