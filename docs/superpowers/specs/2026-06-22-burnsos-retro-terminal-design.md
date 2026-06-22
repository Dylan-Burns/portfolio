# "burnsOS" — Retro-Terminal Portfolio (Design)

**Date:** 2026-06-22
**Status:** Approved (design phase)
**Type:** Landing + project-page redesign (pivots the unmerged `feat/ui-vectored-space` landing)

## Goal

Replace the portfolio landing with a black, minimal, monospace experience whose centerpiece
is a **photoreal retro micro-computer**: projects are browsed as files on its **green-phosphor
CRT**, and selecting one triggers a **white lightspeed "hyperspace" warp** that flies the user
into a cinematic **project page** backed by the previously-built particle field.

Aesthetic, in one line: *strict black & white + monospace, with two deliberate exceptions —
green phosphor on the CRT, and the particle field on project pages.*

## Non-Goals (YAGNI)

- No changes to project content/data in `src/content/` (copy, links, slugs unchanged).
- No new routes/IA beyond what exists (`/`, `/work/[slug]`, `/resume`, 404).
- No gradient/indigo-cyan-violet accent system on the landing (that was the prior direction).
- No multi-color warp, no black-hole/swirl entry (explicitly dropped during exploration).
- No CMS, backend, or analytics work.

## Validated Decisions (from visual brainstorming)

1. **Whole site → B&W minimal, monospace.** Drop the particle field + gradient accents from
   the landing/resume/404.
2. **Landing is a retro micro-computer.** Built for real with a **photoreal PNG render** of the
   machine + a live, interactive **green-phosphor IDE screen** positioned in its CRT cutout.
   (A pure-CSS fallback machine exists from prototyping but the PNG approach is the chosen one.)
3. **Projects are files** on the CRT (`parahealth.tsx // healthcare`), **keyboard-navigable**
   (↑/↓ select, Enter open) and clickable; a **typed** intro line sits above them.
4. **Transition = white star-streak lightspeed warp** (smooth ramp-in, hard acceleration,
   depth-of-field punch, ~2.2s), ending by **flying into** the destination page. Reduced-motion
   skips the warp and navigates instantly.
5. **Project pages keep the vectored-space particle field** (cursor-reactive) as background.
6. **Résumé/contact live as extra files** on the CRT (`resume.pdf`, `contact.txt`) so the whole
   landing is one terminal; resume + 404 are otherwise plain B&W mono pages.

## Architecture / Components

### `RetroComputer` (new, client) — `src/components/retro/RetroComputer.tsx`
- **What it does:** renders the machine. The chassis is a responsive `<img>`/background of the
  PNG render; the CRT screen is an **absolutely-positioned element sized in % against the image's
  known cutout box** (cutout coordinates are a constant derived from the asset). Holds the
  `CrtScreen` inside the cutout. Collapses to a simpler stacked layout below a breakpoint.
- **Interface:** `<RetroComputer items={FileItem[]} intro={string} />`. No data deps beyond props.
- **Dependencies:** the chassis asset, `CrtScreen`.

### `CrtScreen` + IDE (new, client) — `src/components/retro/CrtScreen.tsx`
- **What it does:** the green-phosphor terminal — header line, line-number gutter, the typed
  intro (typewriter w/ blinking caret), and the keyboard-navigable file list. Applies CRT
  treatment (scanlines, vignette, flicker, phosphor glow) via CSS overlays.
- **Interface:** `<CrtScreen items intro />`. Emits navigation through the `FileItem`s (each item
  carries `{ label, comment, href }`).
- **Accessibility contract:** the file list is a real, focusable list of `<a href>` links (or a
  `TransitionLink`); ↑/↓ moves a roving selection, Enter activates the focused link; works with
  keyboard and screen readers; typewriter respects reduced-motion (renders full text instantly,
  no caret animation); green-on-black text must meet contrast (use a light phosphor green).

### `WarpOverlay` + transition (new, client) — `src/components/retro/WarpOverlay.tsx` + `TransitionLink.tsx`
- **WarpOverlay:** a fixed, full-viewport `<canvas>` mounted once in the root layout, `aria-hidden`,
  `pointer-events-none` except while animating. Implements the star-streak warp (ramp-in →
  accelerate → fly-into). Performance: DPR clamped ≤2, star count scaled to viewport & capped,
  single rAF loop that only runs during a transition.
- **TransitionLink:** wraps a normal `next/link`. On activate: if reduced-motion or no-JS →
  behaves as a plain link (direct navigation). Otherwise it runs the handshake below.
- **Interface:** `<TransitionLink href>` ; `WarpOverlay` is controlled via a small shared
  controller (React context provider in the root layout exposing `play(href)`), so any
  `TransitionLink` can start it.

- **Timing contract (the hard part — specified):**
  1. On activate, `TransitionLink` calls `router.prefetch(href)` early (or relies on Link prefetch),
     `preventDefault`s, and calls `controller.play(href)`.
  2. `WarpOverlay` fades in and runs the warp's **ramp+accelerate** phase to full opacity (canvas
     fully covers the screen — this is the visual "cover" moment, ~60–70% of the timeline).
  3. At the cover moment the controller calls `router.push(href)`. Because the overlay fully covers
     the viewport, the destination can mount/suspend underneath without any visible flash.
  4. The overlay then plays the **fly-into** phase and fades its canvas out, revealing the
     destination, which runs its own **mount-in** (scale ~1.05→1 + fade). A max-timeout safety
     (e.g. 2.5s) force-completes the handoff even if navigation is slow, so the user is never stuck
     behind the overlay.
  5. **Back/forward (popstate):** only `TransitionLink` triggers the warp; browser back/forward
     navigate plainly (no warp). This is acceptable and intentional.
- **Why a manual canvas overlay (not the View Transitions API):** a full-screen star-streak is not
  a shared-element morph, so React/Next `<ViewTransition>` buys little here and the canvas warp
  needs frame-level control. View Transitions considered and rejected for this effect.

### Root layout restructure — `src/app/layout.tsx` (+ route groups)
The current root layout globally mounts `ParticleField`, `Nav`, `Footer`, and `PageTransition` —
all of which must NOT apply to the new landing. Restructure so the **root layout is minimal**:
`<html><body>` + fonts + the single `WarpOverlay` (and its controller provider). Then:
- **Landing `/`** renders only `RetroComputer` — no nav, footer, particle field.
- **Project pages** get their chrome from the **`work` segment** — either a `src/app/work/layout.tsx`
  or composed in the page: it mounts `ParticleField` (background), the `← work` top bar, and the
  minimal footer. So the particle field and nav/footer live with the project pages, not globally.
- **`PageTransition` is removed** — its per-route fade is superseded by the WarpOverlay + the
  destination mount-in. (No more double-animation; `motion`'s `PageTransition.tsx` is deleted or
  left unused.)
- **Résumé/404** render their own minimal B&W mono chrome (no machine, no particle field).

### Project page template — `src/app/work/[slug]/page.tsx` (+ existing project components)
- **What it does:** one template for all projects. Background = the existing **`ParticleField`**
  (cursor-reactive, reduced-motion/touch fallbacks already built). Content, top to bottom:
  back link (`← work`) + breadcrumb; **hero** (mono eyebrow `category · year · role`, large title,
  summary, action buttons from `links`); a **browser/phone frame** screenshot; a **details + stack**
  sidebar; **problem / what I built / outcomes** sections; **prev/next pager**.
- **Reuses existing components where possible:** `ProjectHero`, `Gallery`/`BrowserFrame`/`PhoneFrame`,
  `BuildStory`, `ProjectPager`, `ActionButtons` — restyled to the B&W mono system; data still from
  `src/content/projects.ts` (`getProject`, `adjacentProjects`).
- **Mount-in animation:** when arrived via warp, the page scales from ~1.05 + fades; without warp
  (direct load) it renders normally.

### Resume / 404 / chrome
- **Résumé:** reachable as a `resume.pdf` file on the CRT → `/resume`, a plain B&W mono page
  (existing PDF embed + download/open buttons, restyled).
- **404:** terminal-style B&W. May add a `> file not found` mono flavor line, but the `<h1>` MUST
  keep text matching the existing e2e (`/doesn.t exist/i`, i.e. "That page doesn't exist.").
- **Contact:** a `contact.txt` file → mailto or a minimal section; socials as mono links.
- **No global top nav on the landing** (the machine is the page). Project pages get the small
  `← work` bar; minimal mono footer on project pages only.

## Data Flow

`src/content/site.ts` + `projects.ts` feed everything (unchanged). The landing maps `projects`
(+ resume/contact) to `FileItem[]` for the CRT. Project pages resolve `params.slug` via
`getProject`/`adjacentProjects`. `WarpOverlay` is presentational; `TransitionLink` only needs an
`href`.

## The Asset

- **One required asset:** a high-resolution render/photo of a late-'70s/early-'80s micro with a
  clean, rectangular **CRT cutout** (ideally transparent or easily maskable screen area), saved
  under `public/retro/` (e.g. `machine.png` / `machine@2x.png`, plus WebP/AVIF).
- **Cutout box** (top/left/width/height as % of the image) is captured as a single
  source-of-truth constant in `src/components/retro/cutout.ts`, which both the placeholder and the
  final asset use; `RetroComputer` positions `CrtScreen` from it.
- **Responsive behavior:** above the mobile breakpoint, `CrtScreen` is absolutely positioned over
  the chassis image using the % cutout box (the screen scales with the image). **Below the
  breakpoint, the CRT screen detaches from the chassis image** — the machine renders as a smaller
  decorative header (or is hidden) and the terminal becomes a full-width B&W mono panel, so the
  fragile %-cutout alignment is never relied on at small sizes.
- **Sourcing:** a properly-licensed render is sourced/generated (license recorded), or the owner
  supplies their own. Until the final asset lands, development uses a placeholder render of the
  same aspect ratio + cutout so layout is real. **Tracked as a `TODO(owner)`/asset task.**
- **Licensing note:** the chosen image must be cleared for commercial/portfolio use; record the
  source + license in the repo (e.g. `public/retro/CREDIT.md`).

## Accessibility

- File list = real focusable links; roving ↑/↓ + Enter; visible focus state; correct roles/labels.
- All animation respects `prefers-reduced-motion`: no typewriter animation (instant text), no warp
  (instant navigation), no fly-in, no flicker.
- `WarpOverlay` and CRT scanline/vignette layers are `aria-hidden` and never trap focus or block
  clicks except briefly during an intentional transition.
- Green phosphor text uses a light-enough green for contrast; status/comment greens stay legible.
- No-JS / SSR: links navigate normally; project pages fully server-render; content crawlable.

## Performance

- Warp + particle canvases: DPR ≤2, capped particle/star counts, rAF only while active
  (warp: only during a transition; field: pauses on `document.hidden`, static under reduced
  motion/touch — already implemented).
- Chassis image served responsively (sizes/srcset, modern formats); avoid layout shift by
  reserving the machine's aspect ratio.

## Testing & Verification

- Gate stays green: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`
  (Playwright on port **3100**).
- Unit: `FileItem` mapping (projects → files incl. resume/contact); a pure helper for the warp/star
  math if extracted (mirror the existing `particle-field.ts` pattern — keep DOM-free logic testable).
- E2E (rewrite the home cases in `tests/e2e/smoke.spec.ts`): landing renders the machine + a
  focusable list with a real link per project (`a[href="/work/<slug>"]`) PLUS a `resume.pdf` file
  linking to `/resume` (the resume smoke selector must match this CRT file link, since the landing
  no longer has a nav); pressing ↓ then Enter (or click) lands on a project page; each
  `/work/<slug>` renders its `<h1>` + a launch action; reduced-motion path navigates without the
  overlay blocking; 404 still matches `/doesn.t exist/i`. The resume/404 cases otherwise carry over.
- Manual: warp feel on desktop; reduced-motion bypass; keyboard-only nav; mobile stacked layout;
  no console errors; no layout shift.

## Relationship to `feat/ui-vectored-space`

This continues on the **same branch**. **Survives:** `ParticleField` (now used on project pages),
darker tokens, `--font-mono`/Geist Mono, project-page component structure, and the **resume/404
e2e cases**. **Replaced:** the gradient/particle *landing*, the gradient `text-gradient` accent
usage on the landing, the spotlight carousel as the home work section, gradient-on-headline
styling, the global `Nav`/`Footer`/`ParticleField`/`PageTransition` mounts, and **the home e2e
assertions** (carousel tablist / "see my work" / `#work` / home particle canvas) — these are
rewritten for the retro landing, NOT preserved. The old hero/carousel/about home composition and
`PageTransition` are superseded by `RetroComputer` + `WarpOverlay`.

## Rollout Order (for the plan)

1. Asset in place (placeholder render + cutout constant), `public/retro/`.
2. `CrtScreen` + IDE (typed intro, file list, keyboard nav) — standalone, testable.
3. `RetroComputer` (chassis + cutout positioning, responsive) wrapping `CrtScreen`.
4. `WarpOverlay` + `TransitionLink` + root-layout mount + reduced-motion bypass.
5. New landing `/` = `RetroComputer` (retire the carousel/hero/about home composition).
6. Project page template restyle to B&W mono + keep `ParticleField`; mount-in animation.
7. Résumé/404/contact restyle; CRT `resume.pdf`/`contact.txt` files.
8. e2e/unit updates; full verification gate; manual pass.

## Reference

Interactive prototypes from brainstorming live in
`.superpowers/brainstorm/26477-1782162541/` — canonical references: `retro-ide-v2.html`
(machine + green CRT + keyboard nav), `hyperspace-v10.html`/`v13` (clean lightspeed warp),
`project-template.html` (project page + particle field).
