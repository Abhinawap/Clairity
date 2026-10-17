# Feature Spec: Parser spike (JSX → scene graph, class edit → minimal diff)

**Source:** [`project-spec.md`](./project-spec.md), Appendix "Spike: parse a real Next.js component…" and open technical question #1
**Status:** Done (2026-10-17). Findings in [`packages/parser/SPIKE-NOTES.md`](../../packages/parser/SPIKE-NOTES.md)

## Overview

Prove the scene graph idea on real code before any UI work. Parse a real Tailwind/Next.js component into `IRNode[]` with exact source pointers, then apply a class edit and write it back as a one-line diff. Built as the first real code of `packages/parser`, a pure package the extension will import.

**Demo project:** `cruip/tailwind-landing-page-template` (Next 15, React 19, Tailwind v4). Its licence forbids redistribution, so it is cloned outside the repo (`~/StudySes/clairity-demo`) and never committed. Unit tests use our own fixture, `packages/parser/test/fixtures/hero.tsx`.

## Requirements

1. `parseFile(code, file) → IRNode[]`, with `file` as the project-relative POSIX path.
   - One root per outermost JSX expression in the file. Fragments are hoisted; JSX inside `{…}` (conditionals, `.map`) and in attributes becomes a normal child, one node per source element.
   - Lowercase tags are `element`; capitalized or member names (`Image`, `motion.div`) are `component`. Non-whitespace JSX text is `text` (`#text`, whitespace collapsed and trimmed).
   - `source` is Babel's location: 1-based line, 0-based column, trimmed for text. `id` follows [ADR 0001](../adr/0001-node-id-from-source-location.md).
   - `props` holds literal string, number and boolean attributes, except `className` and `style`.
   - Read-only (`editable: false` plus a `reason`) when `className` isn't a static string or the element spreads props.
2. `resolveTailwind(className) → { style, passthroughClasses }` for base (unprefixed) tokens:
   - padding/margin as `BoxValue` (`N × 0.25rem`; preflight makes unset sides `0`; shorthand, then axis, then side)
   - `w-*`/`h-*`
   - `rounded-{size}` → `var(--radius-{size})`; `rounded` → `0.25rem`, `rounded-none` → `0`, `rounded-full` → `calc(infinity * 1px)`; side-specific radii are passthrough
   - `bg-*`/`text-*` colours → `var(--color-*)`
   - `text-{size}`, `font-{weight}`
   - Everything else (variants, arbitrary values, custom classes) is a passthrough class.
3. `editClasses(code, file, nodeId, { added, removed }) → newCode`:
   - Same shape as `ClassChange` in `shared/proposal.ts`.
   - Removed tokens are replaced in place by added ones, leftovers deleted, extra added tokens appended.
   - The new literal is spliced over the old one using Babel's offsets, with the same quote character, so no other byte changes. (recast was tried and dropped: it reprinted whole `return` blocks for tab-indented files and parenthesised roots; see SPIKE-NOTES §5.)
   - Read-only rules are shared with `parseFile`, so it refuses exactly the nodes `parseFile` marks read-only.
   - Throws on an unknown id, a missing token, a read-only node, or an element with no className.

## Success and Verification

| Criterion | How verified | Result |
|---|---|---|
| Source pointers exact | `test/parse.test.ts`: `lines[line-1].slice(column)` for `Image`, `br`, `li`, `motion.div`, two text runs | ✅ pass |
| Scene graph shape | `toMatchObject` against a hand-written tree of the fixture; mutation check confirmed the test fails on a wrong tree | ✅ pass |
| Tailwind mapping | `test/tailwind.test.ts` (8 cases incl. `px-4 sm:px-6 bg-blue-500 rounded-full md:pb-20 btn`) | ✅ pass |
| Read-only cases | `cn()`, template literal and spread in fixture | ✅ pass |
| Minimal diff | `test/transform.test.ts`: exactly one line differs, `sm:px-6` untouched, id survives the edit; root inside `return ( … )`, tab-indented and CRLF files and `'…'`/`` {`…`} `` quoting change nothing else | ✅ pass |
| Loud errors | unknown id, missing token, read-only (non-literal className, spread props), no className | ✅ pass |
| **E2E on real hero** | `DEMO_DIR=~/StudySes/clairity-demo pnpm --filter parser test` | ✅ `1 1 components/hero-home.tsx`; `prettier@3 --check` clean |
| Whole demo parses | same run, every tracked `.tsx` | ✅ 18 files, 489 nodes, 4 read-only |
| Types | `pnpm --filter parser check-types` | ✅ 0 errors |

**Not verified:** the Next dev server hot-reloading the edited file (needs `pnpm install` in the demo and a browser).

## Edge Cases

| Scenario | Behaviour |
|---|---|
| `px-4` next to `sm:px-6` | only the exact token changes |
| Same token twice in one className | first occurrence is edited |
| Tab indentation, CRLF line endings | preserved byte-for-byte |
| Edit pushes a single-line tag past 80 columns | still a one-line diff, but Prettier would now re-wrap it (see SPIKE-NOTES §5) |
| Unparsable file | `parseFile` throws Babel's error; marking the file read-only is the extension's job |

## Not in Scope

Following imports and layouts for a route, inline styles and CSS-in-JS, mapping a style value back to a class token, adding a missing `className`, editing static parts of template-literal classNames, the `data-ir-id` Babel plugin, the file watcher, and anything in `packages/extension` or `packages/web`.
