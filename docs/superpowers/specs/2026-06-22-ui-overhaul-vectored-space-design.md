# Portfolio UI Overhaul — "Vectored Space"

**Date:** 2026-06-22
**Status:** Approved (design phase)
**Type:** Visual reskin (no content, route, or data-model changes)

## Goal

Refactor the entire visual layer of the portfolio so it reads "sleek and sexy" in the
vein of the user's references: **xai.com** (stark black, monospace accents, hairline
rules, maximum contrast) as the structural base, combined with **eragon.ai**'s signature
**gradient accents** and **interactive particle-field background**. spacex.com informs the
overall restraint and use of negative space.

The result: a near-black, high-contrast, technical-but-premium aesthetic where color
appears only as a single gradient accent, sitting over a live cursor-reactive particle field.

## Non-Goals (YAGNI)

- No changes to content in `src/content/` (projects, site config, copy stay as-is).
- No routing/IA changes — same pages: `/`, `/work/[slug]`, `/resume`, `not-found`.
- No new data, CMS, or backend work.
- No swap of the existing `TODO(owner)` placeholder assets (out of scope; tracked separately).
- No light mode (site is dark-only by design).

## Locked Design Decisions (validated with user via visual companion)

1. **Base aesthetic:** xAI brutalist-mono — pure/near-pure black, hairline (1px) rules,
   monospace for small UI text, lots of negative space.
2. **Headlines:** bold **Space Grotesk** (already wired) — NOT monospace. Monospace is for
   labels, eyebrows, captions, and CTAs only.
3. **Color:** the existing gradient (indigo `#8b93ff` → cyan `#22d3ee` → violet `#c084fc`)
   is the single vivid element. Applied to: one key phrase per headline, primary-action
   accents, and the particle-field glow. Everything else is grayscale. The "now"/status
   dot is the one exception — it uses the existing green `--color-live` (`#3ddc97`) since a
   green active dot is the legible convention for "currently building"; gradient is NOT
   used on it.
4. **Background:** an interactive **particle field** (white dust nebula + gradient glow)
   that reacts to the cursor — replaces the current static `GlowBackdrop`.
5. **Motion:** done with the already-installed `motion` package (Framer Motion). Keep
   existing `Reveal`/`PageTransition`; add staggered reveals and subtle magnetic buttons.

## Design System Changes (`src/app/globals.css`)

- **Surfaces:** darken `--color-bg` toward near-pure black (≈`#040509`); keep a slightly
  lifted `--color-bg-2`. Card surfaces become more transparent so the field shows through.
- **Borders:** standardize on hairline tokens (`--color-border` ~`rgba(255,255,255,.10)`,
  `--color-border-strong` for hover/active).
- **Type:** add a monospace font var `--font-mono` (Geist Mono via `next/font` in
  `layout.tsx`). Keep `--font-display` (Space Grotesk) and `--font-sans`.
- **Utilities:** **rewrite** the `text-gradient` utility — today it is only a two-stop
  white→fg mix; change its stops to the locked multi-stop indigo→cyan→violet accent (the
  multi-stop gradient currently lives in `GlowBackdrop`, which is being removed). Add a
  `.label-mono` pattern (uppercase/letter-spaced monospace eyebrow), and a hairline-rule
  helper. Add a reduced-motion-aware policy (already present) covering the field.

## New / Changed Components

### New: `src/components/visuals/ParticleField.tsx` (replaces `GlowBackdrop`)
- **What it does:** renders one `position:fixed` full-viewport `<canvas>` behind all content
  (`z` below content, above body bg). Draws white particles biased into a soft nebula
  cluster + a radial gradient glow.
- **Interface:** `<ParticleField />` — no required props; optional `density?: "med" | "high"`
  and `interaction?: "repel" | "attract"` (defaults: `med` / `repel`). Mounted once in
  `layout.tsx`.
- **Behavior:** particle drift back to origin; cursor proximity applies a depth-weighted
  repel (default) force; pointer position smoothed via `motion` `useMotionValue` +
  `useSpring`.
- **Dependencies:** `motion`, browser canvas API. No data deps.
- **Performance & safety contract:**
  - `devicePixelRatio` clamped to ≤2; particle count capped.
  - `requestAnimationFrame` loop pauses when the canvas is offscreen
    (IntersectionObserver) and when `document.hidden`.
  - `prefers-reduced-motion: reduce` → render a single static frame, no rAF loop, no
    pointer listeners.
  - Pointer interaction attached only for fine pointers (`matchMedia('(pointer:fine)')`);
    touch devices get the static/drift field with no cursor force.
  - Client component (`"use client"`); rendered once, never re-mounts on route change.

### Changed components (apply the language; behavior unchanged)
- `components/ui/Button.tsx` — mono label option, gradient/hairline variants, optional
  magnetic hover (respects reduced motion).
- `components/ui/Section.tsx` (incl. `SectionLabel`) — mono eyebrow + hairline rule.
- `components/ui/Tag.tsx` — hairline mono chip.
- `components/layout/Nav.tsx` — mono links, scroll-triggered hairline border, gradient
  hover/active underline, existing a11y (aria-controls, focus-visible) preserved.
- `components/layout/Footer.tsx` — mono, hairline top border, gradient accent.
- `components/home/Hero.tsx` — mono eyebrow + rule + grotesk headline w/ gradient phrase.
- `components/home/ProjectGrid.tsx`, `ProjectCarousel.tsx`, `ProjectCardBody.tsx` —
  numbered mono index, hairline translucent cards, gradient hover sweep + lift.
- `components/home/AboutSection.tsx` — hairline portrait frame, mono tool chips, gradient
  "now" status line + live dot.
- `components/project/*` (`ProjectHero`, `Gallery`, `BrowserFrame`, `PhoneFrame`,
  `ActionButtons`, `BuildStory`, `ProjectPager`) — hairline frames, mono captions/labels,
  gradient on primary actions.
- `app/resume/page.tsx`, `app/not-found.tsx` — same tokens.
- `components/motion/Reveal.tsx`, `PageTransition.tsx`, `motion-config.ts` — extend with
  stagger variants; keep reduced-motion behavior.

## Data Flow

No data flow changes. `ParticleField` is purely presentational and self-contained.
All page content continues to flow from `src/content/*` through the same components.

## Accessibility

- Particle field is decorative: `aria-hidden`, not focusable, never traps interaction
  (pointer-events handled so it doesn't block clicks).
- Full `prefers-reduced-motion` compliance (static field, no parallax, no magnetic buttons).
- Maintain existing contrast: body text stays on solid-enough surfaces; verify gradient
  text and mono-muted colors meet contrast over the darker bg.
- Preserve all current ARIA/focus-visible work noted in recent commits.

## Testing & Verification

- Existing gates must stay green:
  `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`
  (Playwright runs on port **3100**).
- Add a lightweight unit/DOM check that `ParticleField` renders an `aria-hidden` canvas and
  that, under a mocked `prefers-reduced-motion`, no animation loop is started.
- E2E smoke: each route still renders its key headings (existing Playwright specs); add a
  check that the canvas mounts and content remains clickable above it.
- Manual: verify cursor interaction on desktop, static fallback under reduced motion, and
  no layout shift / scroll jank on mid-range hardware.

## Rollout Order (for the implementation plan)

1. Tokens + fonts (`globals.css`, `layout.tsx`) — foundation.
2. `ParticleField` component + mount in `layout.tsx` (remove `GlowBackdrop`).
3. Shared UI primitives (`Button`, `Section`, `Tag`) + motion helpers.
4. Layout chrome (`Nav`, `Footer`).
5. Home sections (`Hero`, project grid/carousel/cards, `About`).
6. Project detail components + `resume` + `not-found`.
7. Full verification gate + manual pass.

## Reference

Live interactive mockups produced during brainstorming are saved under
`.superpowers/brainstorm/52219-1782158566/` (aesthetic-direction, type-mix, texture,
particles). The `particles.html` file is the canonical reference for the field's behavior.
