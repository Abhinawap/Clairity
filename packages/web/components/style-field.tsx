"use client";
import { useState } from "react";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const NUM_UNIT = /^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/;
const toSixDigits = (hex: string) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex);

function stepNumeric(raw: string, dir: 1 | -1, shift: boolean): string | undefined {
  const m = raw.trim().match(NUM_UNIT);
  if (!m) return undefined;
  const num = Number.parseFloat(m[1]);
  const unit = m[2] ?? "px";
  const step = (unit === "rem" || unit === "em" ? 0.25 : 1) * (shift ? 10 : 1);
  const next = Math.round((num + dir * step) * 100) / 100;
  return `${next}${unit === "px" && m[2] === undefined && next === 0 ? "" : unit}`;
}

// Keeps a draft while the user types; the store only ever holds confirmed values.
// The caller keys this on the confirmed value, so a patch from the extension resets the draft.
// shortcut: an empty value is never sent, because the protocol has no "remove this property" yet
export function StyleField({
  label,
  value,
  disabled,
  color,
  compact,
  placeholder,
  onCommit,
}: {
  label: string;
  value?: string;
  disabled?: boolean;
  color?: boolean;
  compact?: boolean;
  placeholder?: string;
  onCommit(value: string): void;
}) {
  const confirmed = value ?? "";
  const [draft, setDraft] = useState(confirmed);
  const commit = (val = draft) => {
    const next = val.trim();
    if (next && next !== confirmed) onCommit(next);
  };
  const swatch = color && (draft === "" || HEX.test(draft));

  return (
    <label className="flex min-w-0 items-center gap-1.5">
      <span className={`${compact ? "w-11" : "w-20"} shrink-0 truncate text-xs text-[#004346]/70 dark:text-[#DAF5EE]/70 transition-colors`}>{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {swatch && (
          <input
            type="color"
            aria-label={`${label} colour`}
            disabled={disabled}
            value={HEX.test(draft) ? toSixDigits(draft) : "#09BC8A"}
            onChange={(e) => {
              setDraft(e.target.value);
              commit(e.target.value);
            }}
            className="size-6 shrink-0 cursor-pointer rounded border border-[#DAF5EE] bg-transparent disabled:cursor-not-allowed dark:border-[#004346] transition-colors"
          />
        )}
        <input
          type="text"
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(confirmed);
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              const stepped = stepNumeric(draft || "0px", e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
              if (stepped) {
                e.preventDefault();
                setDraft(stepped);
                commit(stepped);
              }
            }
          }}
          className="h-7 w-full min-w-0 rounded-md border border-[#DAF5EE] bg-transparent px-2 font-mono text-xs text-[#172A3A] placeholder:text-[#004346]/40 focus:border-[#09BC8A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#004346] dark:bg-[#172A3A]/60 dark:text-[#F2FBF9] dark:placeholder:text-[#DAF5EE]/40 transition-colors"
        />
      </span>
    </label>
  );
}
