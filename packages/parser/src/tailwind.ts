import type { BoxValue, IRNode } from "./ir";

type Style = IRNode["style"];
type Side = keyof BoxValue;

// Tailwind v4 default palette. ponytail: colours from the project's own @theme fall through to passthrough
const PALETTE = new Set([
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
]);
const TEXT_SIZES = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"]);
const RADII = new Set(["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]);
const WEIGHTS = new Set(["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"]);

// Shorthand before axis before side, mirroring the order Tailwind emits them in CSS.
const BOX_SIDES: Record<string, { rank: number; sides: Side[] }> = {
  "": { rank: 0, sides: ["top", "right", "bottom", "left"] },
  x: { rank: 1, sides: ["right", "left"] },
  y: { rank: 1, sides: ["top", "bottom"] },
  t: { rank: 2, sides: ["top"] },
  r: { rank: 2, sides: ["right"] },
  b: { rank: 2, sides: ["bottom"] },
  l: { rank: 2, sides: ["left"] },
};

// "4" -> "1rem", "0.5" -> "0.125rem", "px" -> "1px" (v4: --spacing is 0.25rem)
function spacing(value: string): string | undefined {
  if (value === "px") return "1px";
  if (!/^\d+(\.\d+)?$/.test(value)) return undefined;
  const n = Number(value);
  return n === 0 ? "0" : `${n * 0.25}rem`;
}

// padding can't be negative or auto; -m-0 and -m-auto aren't utilities
function boxValue(prop: "padding" | "margin", raw: string, negative: boolean): string | undefined {
  if (prop === "margin" && raw === "auto") return negative ? undefined : "auto";
  const value = spacing(raw);
  if (!negative || value === undefined) return value;
  return prop === "margin" && value !== "0" ? `-${value}` : undefined;
}

function size(value: string, axis: "w" | "h"): string | undefined {
  if (value === "full") return "100%";
  if (value === "auto") return "auto";
  if (value === "screen") return axis === "w" ? "100vw" : "100vh";
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) return `${(Number(fraction[1]) / Number(fraction[2])) * 100}%`;
  return spacing(value);
}

function color(value: string): string | undefined {
  if (value === "transparent") return "transparent";
  if (value === "current") return "currentColor";
  if (value === "white" || value === "black") return `var(--color-${value})`;
  const [name, shade, ...rest] = value.split("-");
  if (rest.length === 0 && PALETTE.has(name) && /^(50|[1-9]00|950)$/.test(shade ?? "")) return `var(--color-${value})`;
  return undefined;
}

function radius(value: string): string | undefined {
  if (value === "") return "0.25rem";
  if (value === "none") return "0";
  if (value === "full") return "calc(infinity * 1px)";
  return RADII.has(value) ? `var(--radius-${value})` : undefined;
}

/** Maps base (unprefixed) Tailwind tokens onto IR style; everything else is a passthrough class. */
export function resolveTailwind(className: string): { style: Style; passthroughClasses: string[] } {
  const style: Style = {};
  const passthroughClasses: string[] = [];
  const box: { prop: "padding" | "margin"; rank: number; sides: Side[]; value: string }[] = [];

  for (const token of className.split(/\s+/).filter(Boolean)) {
    // variants (md:, hover:), arbitrary values ([...]) and !important stay verbatim
    if (/[:[!]/.test(token)) {
      passthroughClasses.push(token);
      continue;
    }

    const boxMatch = token.match(/^(-?)([pm])([xytrbl]?)-(.+)$/);
    if (boxMatch) {
      const [, negative, letter, axis, raw] = boxMatch;
      const prop = letter === "p" ? "padding" : "margin";
      const value = boxValue(prop, raw, negative === "-");
      if (value !== undefined) {
        box.push({ prop, value, ...BOX_SIDES[axis] });
        continue;
      }
    }

    const [, utility, value = ""] = token.match(/^([a-z]+)(?:-(.+))?$/) ?? [];
    let mapped = false;
    const set = <K extends keyof Style>(key: K, v: Style[K] | undefined) => {
      if (v !== undefined) {
        style[key] = v;
        mapped = true;
      }
    };
    if (utility === "w") set("width", size(value, "w"));
    else if (utility === "h") set("height", size(value, "h"));
    else if (utility === "rounded") set("borderRadius", radius(value));
    else if (utility === "bg") set("backgroundColor", color(value));
    else if (utility === "text") {
      if (TEXT_SIZES.has(value)) set("fontSize", `var(--text-${value})`);
      else set("color", color(value));
    } else if (utility === "font" && WEIGHTS.has(value)) set("fontWeight", `var(--font-weight-${value})`);

    if (!mapped) passthroughClasses.push(token);
  }

  // preflight zeroes padding and margin, so unset sides are 0
  for (const { prop, sides, value } of box.sort((a, b) => a.rank - b.rank)) {
    style[prop] ??= { top: "0", right: "0", bottom: "0", left: "0" };
    for (const side of sides) style[prop][side] = value;
  }

  return { style, passthroughClasses };
}
