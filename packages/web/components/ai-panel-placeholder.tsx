import { Sparkles } from "lucide-react";

// Stand-in until the data layer has the Proposal actions (web-data-layer slices 5–6). Fixes the layout without inventing state.
export function AiPanelPlaceholder() {
  return (
    <section aria-label="AI panel" className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <Sparkles className="size-3.5" aria-hidden /> AI
      </h2>
      <label className="sr-only" htmlFor="ai-scope">Scope</label>
      <select id="ai-scope" disabled className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs disabled:opacity-60 dark:border-zinc-800">
        <option>Selected Node</option>
        <option>Page</option>
      </select>
      <label className="sr-only" htmlFor="ai-prompt">Prompt</label>
      <textarea
        id="ai-prompt"
        disabled
        rows={3}
        placeholder="Make this hero more premium and cinematic…"
        className="w-full resize-none rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-xs disabled:opacity-60 dark:border-zinc-800"
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">AI requests arrive with the Proposal actions.</p>
    </section>
  );
}
