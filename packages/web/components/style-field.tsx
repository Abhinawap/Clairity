"use client";
import { useState } from "react";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const toSixDigits = (hex: string) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex);

// Keeps a draft while the user types; the store only ever holds confirmed values.
// The caller keys this on the confirmed value, so a patch from the extension resets the draft.
// shortcut: an empty value is never sent, because the protocol has no "remove this property" yet
export function StyleField({
  label,
  value,
  disabled,
  color,
  onCommit,
}: {
  label: string;
  value?: string;
  disabled?: boolean;
  color?: boolean;
  onCommit(value: string): void;
}) {
  const confirmed = value ?? "";
  const [draft, setDraft] = useState(confirmed);
  const commit = () => {
    const next = draft.trim();
    if (next && next !== confirmed) onCommit(next);
  };
  const swatch = color && (draft === "" || HEX.test(draft));

  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {swatch && (
          <input
            type="color"
            aria-label={`${label} colour`}
            disabled={disabled}
            value={HEX.test(draft) ? toSixDigits(draft) : "#ffffff"}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            className="size-6 shrink-0 cursor-pointer rounded border border-zinc-200 bg-transparent disabled:cursor-not-allowed dark:border-zinc-700"
          />
        )}
        <input
          type="text"
          value={draft}
          disabled={disabled}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(confirmed);
          }}
          className="h-7 w-full min-w-0 rounded-md border border-zinc-200 bg-transparent px-2 font-mono text-xs focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
        />
      </span>
    </label>
  );
}
