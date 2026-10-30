# Design

> Maintained alongside the landing page work.
> Source of truth for typography, color, motion, layout, and component tokens.
> Read this BEFORE touching the UI in any subsequent session.

## Aesthetic direction

Editorial brutalism — a printer's proof of the product: paper, ink, one deep teal canvas, one black code card, oversized type, and hand-drawn display glyphs used as accents rather than whole paragraphs.

## Dials

- DESIGN_VARIANCE: 8 / 10  (asymmetric hero, blocks that break the grid on hover)
- MOTION_INTENSITY: 6 / 10  (large, deliberate grid transitions; no ambient noise)
- VISUAL_DENSITY: 4 / 10  (airy hero, dense code card)

## Type stack

- Display accents: Dirtyline 36Daysoftype 2022 (local OTF, `app/fonts/Dirtyline 36daysoftype 2022.otf`, via `next/font/local`, `--font-dirtyline` / `font-display`)
- Headline + UI: Plus Jakarta Sans (variable, `next/font/google`, `--font-plus-jakarta-sans`)
- Mono: Tailwind/system mono stack for file names, labels, and code
- Dirtyline is used **only for accent glyphs** inside otherwise clean words: the R in `YOUR`, the GN in `DESIGN`, the O in `YOUR FILES`, the R in `SUPERCHARGED`. Do not set whole paragraphs in it.
- Headline is Plus Jakarta Sans 500 at `clamp(2rem, 7.5vw, 7rem)`, `tracking-[-0.055em]`, `leading-[0.84]`. It becomes 700 on hover.

Banned in this project: Inter, Roboto, system-ui as a primary UI face, and full-sentence Dirtyline.

## Color tokens

```css
--brand-offblack: #080C0E;
--brand-navy:     #172A3A;
--brand-teal:     #004346;
--brand-emerald:  #09BC8A;
--brand-mint:     #DAF5EE;
--brand-foam:     #F2FBF9;
--brand-paper:    #F8F5EE;   /* hero paper, not pure white */
--brand-orange:   #FF4D00;   /* the AI mark, used sparingly */
```

- Light hero: paper `#F8F5EE` + ink `#080C0E`.
- Dark hero: ink `#080C0E` + foam `#F2FBF9`; teal canvas and emerald stay fixed.
- Code card: `#05090A` with `#DAF5EE` type, emerald additions, warm red removals.
- One accent in the hero: orange `#FF4D00`, reserved for the AI mark and the `AI` hover state. Emerald is the product/interaction color.

Banned in this project: pure `#FFF` as a page background, purple-to-blue gradients, more than one decorative accent per section.

## Shadows

```css
--shadow-code-card: 0 24px 70px -38px rgba(8, 12, 14, 0.65);
```

Tint shadows toward the ink token; no pure-black drops.

## Motion

- Grid transition: `700ms cubic-bezier(0.22, 1, 0.36, 1)`.
- Code reveal: `650ms` with the same easing; the code track scrolls `18s linear infinite`.
- Hover weight/color/rotation: `400–600ms`.
- Only `transform`, `opacity`, `grid-template-columns`, `grid-template-rows`, `font-variation-settings`, and `color` animate. No width/height animation.
- `prefers-reduced-motion` disables all hero transitions and the code scroll.

## Layout

- Container: `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10`.
- Hero top: `grid-template-columns: 0.56fr / 0.44fr`; on canvas hover/focus-within it becomes `0.22fr / 0.78fr` so the teal canvas expands left and the title wraps.
- Hero middle: `1.55fr / 1fr` on desktop; black code card left, `< YOUR FILES.` label right aligned to the card bottom.
- Code expansion: `grid-template-rows: 0fr -> 1fr` on hover/focus-visible; the trigger is the base card, so the hover target does not move.
- Full-height sections use `min-h-[100dvh]`, never `h-screen`.
- Mobile: hero top collapses to one column; the canvas keeps a 330px minimum; nav links hide; the install pill and theme toggle stay.

## Projects workspace

- Paper page, sticky `paper/90` nav, dot-grid header wash masked to 320px.
- Header: asymmetric title block (Dirtyline accent on the `P` in `Projects`) + black `New project` CTA with a one-line extension note.
- Stats: 3-column `divide-x` strip (projects / live sessions / scene nodes), never cards.
- Views: cards are the default; the connected card spans both columns and shows its extension session. A `Cards / Rows` toggle sits beside search; rows use a dense table with a tinted, bold column-header strip.
- Connected cards/rows: mint tint, emerald rule, pulsing live dot; idle rows stay quiet.
- Mobile: cards stack; row metadata collapses into one mono line; the dialog becomes a 358px paper panel with stacked fields.
- Dialog: sharp paper panel, 1px emerald top rule, mono uppercase labels, 44px fields, black submit, ink/55 overlay.

## Component inventory

- `LandingHero` — nav, editorial 2x2 hero, supporting about strip.
- `CanvasBlock` — teal Figma-style canvas, selected button, layer panel that slides in.
- `CodeBlock` — dark code card with a diff and a credits-style scroll panel.
- `AiMark` — hand-drawn loop/arrow SVG, orange, attached to the headline.
- `InsideCodebaseSection`, `StartBanner`, `DesignReviewShip` — Figma lower-page sections.
- `ProjectsHome` — paper workspace index with sticky nav, stat strip, tabbed list, search, empty state, and register dialog.
- Shared brand shims: `ThemeToggle`, `TopBar`, `ProjectsHome`.

## Project-specific bans

- No generic SaaS hero copy. Use the product's actual mechanism: visual edits become source diffs.
- No fake "Acme" / "John Doe" data in product surfaces.
- No emojis; use Lucide or the existing GitHub SVGs.
- No nested cards beyond one level.
- No `h-screen`.

## Brand voice (copy)

- Tone: direct, technical, slightly dry.
- Banned: elevate, seamless, unleash, next-gen, game-changing.
- Button labels: concrete verbs ("Open the editor", "Install extension", "Get started").
- The hero says what the product does: `YOUR DESIGN?`, `YOUR FILES.`, `SUPERCHARGED; WITH AI`.

## Accessibility floor

- WCAG 2.2 AA contrast on body copy.
- Focus-visible rings on every interactive element; the canvas and code card reveal on focus as well as hover.
- `prefers-reduced-motion` respected.
- Touch targets at least 36–44px in the landing header and CTAs.

## Last updated

2026-10-30 by the landing hero build — established the paper/ink palette, Dirtyline accents, asymmetric canvas/code hero, and hover mechanics.
2026-10-30 by the projects workspace rebuild — replaced the card grid with a paper index: stat strip, divided rows, live tint, empty state, and a sharp register dialog.
