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
    // Arbitrary values of the utilities modelled here (w-[240px], text-[#0f172a], p-[1.5rem]) map like scale ones,
    // so a value the inspector or a Proposal wrote reads back as that style.
    const arb = token.match(/^([a-z]+)-\[([^\]]+)\]$/);
    if (arb) {
      const [, utility, raw] = arb;
      const value = raw.replace(/_/g, " ");
      const boxArb = utility.match(/^([pm])([xytrbl]?)$/);
      if (boxArb) {
        box.push({ prop: boxArb[1] === "p" ? "padding" : "margin", value, ...BOX_SIDES[boxArb[2]] });
        continue;
      }
      const key: keyof Style | undefined =
        utility === "w" ? "width"
        : utility === "h" ? "height"
        : utility === "rounded" ? "borderRadius"
        : utility === "bg" && looksLikeColor(value) ? "backgroundColor"
        : utility === "text" && (value.startsWith("color:") || looksLikeColor(value)) ? "color"
        : utility === "text" && (px(value) !== undefined || /^(var\(--text|calc|clamp|\d)/.test(value)) ? "fontSize"
        : utility === "font" && /^\d+$/.test(value) ? "fontWeight"
        : undefined;
      if (key) {
        (style as Record<string, string>)[key] = value.replace(/^color:/, "");
        continue;
      }
    }

    // variants (md:, hover:), other arbitrary values ([...]) and !important stay verbatim
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

// ---- Style -> classes: the inverse of resolveTailwind, checked against it so the two can't disagree. ----

type StyleKey = Exclude<keyof Style, "padding" | "margin">;
// The utility each property is written with. text- is shared: its arbitrary value says which (color or size).
const UTILITY: Partial<Record<StyleKey, string>> = {
  width: "w", height: "h", borderRadius: "rounded", backgroundColor: "bg", color: "text", fontSize: "text", fontWeight: "font",
};
const SPACING_STEPS = ["px", ...Array.from({ length: 193 }, (_, i) => String(i / 2))]; // 0, 0.5, … 96
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const CANDIDATES: Record<string, string[]> = {
  w: [...SPACING_STEPS, "full", "auto", "screen", "1/2", "1/3", "2/3", "1/4", "3/4"],
  h: [...SPACING_STEPS, "full", "auto", "screen", "1/2"],
  rounded: ["", "none", "full", ...RADII],
  bg: ["transparent", "current", "white", "black", ...[...PALETTE].flatMap((c) => SHADES.map((s) => `${c}-${s}`))],
  text: [...TEXT_SIZES, "transparent", "current", "white", "black", ...[...PALETTE].flatMap((c) => SHADES.map((s) => `${c}-${s}`))],
  font: [...WEIGHTS],
};

// Lengths compare by pixels (1rem = 16px), so a canvas drag to "240px" finds w-60 (15rem).
function px(value: string): number | undefined {
  const m = value.trim().match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m) return undefined;
  return Number(m[1]) * (m[2] === "rem" ? 16 : 1);
}
const same = (a: string | undefined, b: string) => a !== undefined && (a === b || (px(a) !== undefined && px(a) === px(b)));
const looksLikeColor = (v: string) => /^(#|rgb|hsl|oklch|var\(--color)/.test(v) || ["transparent", "currentColor"].includes(v);

const token = (utility: string, value: string) => (value === "" ? utility : `${utility}-${value}`);

/** The class that sets one property to `value`: a scale class when one matches, else an arbitrary value. */
export function classFor(property: StyleKey, value: string): string {
  const utility = UTILITY[property];
  if (!utility) throw new Error(`No Tailwind utility for ${property}`);
  const scale = CANDIDATES[utility].map((v) => token(utility, v)).find((t) => same(resolveTailwind(t).style[property] as string, value));
  // Tailwind reads text-[…] as a color when the value looks like one, else as a size; color: prefix forces it
  const arbitrary = property === "color" && !looksLikeColor(value) ? `text-[color:${value}]` : `${utility}-[${value.replace(/\s+/g, "_")}]`;
  return scale ?? arbitrary;
}

function spacingClass(prefix: string, value: string): string {
  if (value === "auto") return `${prefix}-auto`;
  const scale = SPACING_STEPS.find((s) => same(spacing(s), value));
  return scale !== undefined ? `${prefix}-${scale}` : `${prefix}-[${value}]`;
}

// Fewest classes for a box: p-4, px-4 py-2, or one per side.
function boxClasses(letter: "p" | "m", box: BoxValue): string[] {
  const { top, right, bottom, left } = box;
  if (top === right && right === bottom && bottom === left) return [spacingClass(letter, top)];
  if (top === bottom && right === left) return [spacingClass(`${letter}x`, right), spacingClass(`${letter}y`, top)];
  return [spacingClass(`${letter}t`, top), spacingClass(`${letter}r`, right), spacingClass(`${letter}b`, bottom), spacingClass(`${letter}l`, left)];
}

/** Whether a base (unprefixed) token currently sets this property: a scale class or an arbitrary one. */
function setsProperty(tok: string, property: keyof Style): boolean {
  if (/[:!]/.test(tok)) return false; // variants (md:, hover:) and !important are other states, left alone
  if (property === "padding" || property === "margin") return new RegExp(`^-?${property[0]}[xytrbl]?-`).test(tok);
  if (resolveTailwind(tok).style[property] !== undefined) return true;
  const arb = tok.match(/^([a-z]+)-\[(.+)\]$/);
  if (!arb || arb[1] !== UTILITY[property]) return false;
  if (arb[1] !== "text") return true;
  const value = arb[2].replace(/^color:/, "");
  return property === "color" ? arb[2].startsWith("color:") || looksLikeColor(value) : !arb[2].startsWith("color:") && !looksLikeColor(value);
}

/**
 * The class change that gives an element these style values: the tokens that set each property now, and the ones
 * that will. Only base tokens are touched; responsive and state variants stay as they are.
 */
export function styleClasses(className: string, style: Partial<Style>): { removed: string[]; added: string[] } {
  const tokens = className.split(/\s+/).filter(Boolean);
  const perProperty: { removed: string[]; added: string[] }[] = [];
  for (const [property, value] of Object.entries(style) as [keyof Style, Style[keyof Style]][]) {
    if (value === undefined) continue;
    const taken = perProperty.flatMap((p) => p.removed);
    const removed = tokens.filter((t) => setsProperty(t, property) && !taken.includes(t));
    const added = property === "padding" || property === "margin" ? boxClasses(property === "padding" ? "p" : "m", value as BoxValue) : [classFor(property, value as string)];
    perProperty.push({ removed, added });
  }
  // editClasses puts added tokens where removed ones were, in order: so each property's new classes are paired
  // with the ones they replace first, and only then come the leftovers (extra removals, then extra additions).
  const paired = (p: { removed: string[]; added: string[] }) => Math.min(p.removed.length, p.added.length);
  const removed = [...perProperty.flatMap((p) => p.removed.slice(0, paired(p))), ...perProperty.flatMap((p) => p.removed.slice(paired(p)))];
  const added = [...perProperty.flatMap((p) => p.added.slice(0, paired(p))), ...perProperty.flatMap((p) => p.added.slice(paired(p)))];
  return { removed, added };
}
