# Parser spike notes (2026-10-17)

Answers to the spike questions in [`docs/specs/project-spec.md`](../../docs/specs/project-spec.md) (Appendix), measured on the demo project `cruip/tailwind-landing-page-template` @ `909e38e` (Next 15, React 19, Tailwind v4). The demo is cloned outside the repo; see [`docs/specs/parser-spike.md`](../../docs/specs/parser-spike.md).

**Verdict: the scene graph idea holds.** Every demo file parses, 485 of 489 nodes are editable, every source pointer checked is exact, and a class edit on the real hero is a one-line, Prettier-clean diff.

## 1. How precise is Babel's `loc`?

Exact to the character for elements: `line` is 1-based, `column` is 0-based and points at the `<`. The one catch is `JSXText`: its `loc` covers the surrounding newlines and indentation, so the parser trims the text and moves the start/end by the trimmed amount. Checked by `lines[line-1].slice(column)` starting with `<name` (or the text) for elements, components, member components (`motion.div`), `.map` children and both halves of a `<br />`-split text run.

## 2. What do dynamic classNames look like in the AST?

The demo never uses `cn()`. All 4 dynamic classNames are template literals: a long static list plus one interpolated toggle.

```tsx
className={`origin-center transform fill-gray-400 transition duration-200 ease-out ${accordionOpen && "rotate-180!"}`}
```

In the AST that is a `JSXExpressionContainer` holding a `TemplateLiteral` with `quasis` (the static strings) and `expressions` (the `${…}` parts). A template literal with no expressions is treated as a plain string and stays editable.

**Follow-up:** treating the static quasi tokens as editable (and the interpolated part as passthrough) would make all 489 demo nodes editable.

## 3. How often does the demo hit read-only cases?

4 of 489 nodes (0.8%) across 18 files, all for "className is not a string literal":

| File | Read-only |
|---|---|
| `app/layout.tsx` | `body` (`${inter.variable} …`) |
| `components/accordion.tsx` | `svg`, `div` (open/closed toggle) |
| `components/ui/footer.tsx` | `div` (optional border) |

No spread props in the demo. Reproduce with `DEMO_DIR=~/StudySes/clairity-demo pnpm --filter parser exec vitest run test/demo.test.ts --silent=false`.

## 4. Is resolving imports one level deep enough?

Not on its own:
- `app/(default)/page.tsx` renders `Hero`, `BusinessCategories`, `FeaturesPlanet`, `LargeTestimonial` and `Cta`, all through the `@/*` path alias (`tsconfig.json` `paths`), so the resolver must read that alias.
- `Header` and `Footer` come from `app/(default)/layout.tsx`, not the page. A route's tree is therefore the **layout chain** (`app/layout.tsx` → `app/(default)/layout.tsx`) plus the page, with `{children}` as the slot where the page goes.
- `Hero` itself renders `PageIllustration`, which is two levels from the page. It's decorative, so one level from each layout and page file is enough for the demo script.

## 5. Does recast keep Prettier formatting?

**Not reliably, so class edits don't use it.** recast 0.24 (with Babel 7 or 8) reprinted far more than the edited string in two common shapes:

- an element directly inside `return ( … )`: `return (\n  <div className="p-4" />\n);` became `return (<div className="p-6" />);`
- any tab-indented file: the whole `return` block was re-indented with spaces

It also rewrites CRLF to LF across the whole file unless `lineTerminator` is set, and its node positions refer to its own tab-expanded copy of the source, so they don't match `parseFile`'s.

A class edit only replaces one string literal, so `editClasses` **splices the new literal over the old one using Babel's offsets**, and every other byte of the file stays as it was. This holds for spaces, tabs, CRLF, parenthesised roots and `'…'`/`{`…`}` quoting (all covered by tests). recast stays out until we need structural edits (inserting elements, adding a `className` attribute), and those shapes must be re-tested then.

On the real hero, `px-4 → px-6` gives:

```diff
@@ -14 +14 @@ export default function HeroHome() {
-      <div className="mx-auto max-w-6xl px-4 sm:px-6">
+      <div className="mx-auto max-w-6xl px-6 sm:px-6">
```

`1 file changed, 1 insertion, 1 deletion`, and `prettier@3 --check` passes.

**Nothing re-wraps lines.** Adding three classes to `<div className="pb-16 md:pb-20" data-aos="zoom-y-out">` (`features-planet.tsx:21`) pushes the line past Prettier's 80 columns. The diff is still one line, but `prettier --check` now fails, because Prettier wants the attributes on separate lines. Classes inside an element whose attributes are already on separate lines don't trigger this.

**Recommendation:** keep writes as minimal splices and don't auto-run Prettier. A one-line change is easier to review, and the developer's format-on-save or pre-commit hook fixes the wrapping. Revisit if the demo needs `prettier --check` to stay green after AI edits that add many classes.

## Also learned

- Node ids are computed from character offsets, not Babel's `loc`, so the parser and the transformer always agree (ADR 0001).
- Tailwind v4 exposes the whole theme as CSS variables, so mapping `bg-blue-500` to `var(--color-blue-500)` and `rounded-lg` to `var(--radius-lg)` needs no colour or radius table. Colours from the project's own `@theme` (none in the demo hero) fall back to passthrough.
- The demo runs `next dev --turbopack`, which matters for injecting `data-ir-id` (separate spike).
