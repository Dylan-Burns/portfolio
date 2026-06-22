# burnsOS Retro-Terminal Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portfolio landing with the approved "burnsOS" experience — an intro typewriter that dissolves into a photoreal retro computer whose green CRT shows the projects as files; selecting one fires a white lightspeed warp that flies into a B&W project page backed by the existing particle field.

**Architecture:** A minimal root layout mounts only fonts + a global `WarpOverlay` (via a context provider). The landing (`/`) renders a self-contained `RetroComputer` (intro overlay → photo scene with the live CRT terminal → zoom). Project pages get their own chrome (particle field, back bar, footer). Navigation from a project file runs the warp, then `router.push`. DOM-free logic (file mapping, warp math) lives in tested pure modules.

**Tech Stack:** Next.js 16 App Router, React 19, `motion` v12 (`motion/react`), TypeScript, Tailwind v4, `next/font`, Vitest (node env), Playwright (port 3100).

**Spec:** `docs/superpowers/specs/2026-06-22-burnsos-retro-terminal-design.md`
**Canonical visual reference (match this):** `docs/superpowers/reference/burnsos-landing-prototype.html`
**Branch:** continue on `feat/ui-vectored-space` (already checked out). Commit after every task.

---

## File Map

**Create**
- `src/components/retro/cutout.ts` — CRT cutout box + zoom constants (single source of truth).
- `src/content/file-items.ts` — pure `toFileItems(projects, site)` → `FileItem[]`. Node-testable.
- `tests/unit/file-items.test.ts` — unit tests for the mapping.
- `src/components/retro/warp-field.ts` — pure warp/star math (`seedStars`, `ramp`, `stepStar`, `starCount`). Node-testable.
- `tests/unit/warp-field.test.ts` — unit tests for the warp math.
- `src/components/retro/WarpOverlay.tsx` — `"use client"` fixed canvas + `WarpProvider`/`useWarp` context exposing `play(href)`.
- `src/components/retro/TransitionLink.tsx` — `"use client"` link that runs the warp then navigates (reduced-motion → plain nav).
- `src/components/retro/CrtScreen.tsx` — `"use client"` green terminal (header, gutter, `ls ./work`, file list) sized to fit the cutout.
- `src/components/retro/IntroOverlay.tsx` — `"use client"` two-line typewriter that auto-dissolves.
- `src/components/retro/Legend.tsx` — the retro command legend (plinth hint ↔ left list).
- `src/components/retro/RetroComputer.tsx` — `"use client"` the scene: photo + CRT + zoom state + keyboard + selection + intro + legend.
- `src/app/work/layout.tsx` — segment layout for project pages: particle field bg + back bar + footer.
- `public/retro/CREDIT.md` — image source/license note.

**Modify**
- `src/app/layout.tsx` — strip global `Nav`/`Footer`/`ParticleField`/`PageTransition`; mount `WarpProvider` + `WarpOverlay`; keep fonts/tokens.
- `src/app/page.tsx` — render `<RetroComputer/>` only.
- `src/app/globals.css` — add the gradient page background + retro/phosphor/scanline utility bits used by the retro components (scoped; keep existing tokens).
- `src/components/project/ProjectHero.tsx`, `Gallery.tsx`, `BrowserFrame.tsx`, `PhoneFrame.tsx`, `BuildStory.tsx`, `ProjectPager.tsx`, `ActionButtons.tsx` — restyle to B&W mono per the project-template reference (no gradient).
- `src/app/resume/page.tsx`, `src/app/not-found.tsx` — B&W mono terminal styling (keep 404 heading text).
- `tests/e2e/smoke.spec.ts` — rewrite home cases for the retro landing; keep resume/404.

**Delete (after landing no longer imports them)**
- `src/components/home/Hero.tsx`, `ProjectGrid.tsx`, `ProjectCarousel.tsx`, `ProjectCardBody.tsx`, `AboutSection.tsx`, `MagneticButton.tsx` (unused by the new landing), `src/components/motion/PageTransition.tsx` (superseded by the warp).

**Keep / reuse**
- `src/components/visuals/ParticleField.tsx` + `particle-field.ts` (now used on project pages).
- `src/content/projects.ts`, `site.ts` (data unchanged — do NOT edit `src/content/` data).
- Tokens + `--font-mono`/Geist Mono in `globals.css`.

---

## Chunk 1: Foundation — constants, layout de-globalization, project chrome

### Task 1: Cutout & zoom constants

**Files:** Create `src/components/retro/cutout.ts`

- [ ] **Step 1: Implement** (values measured from `public/retro/machine.png`, 1536×1024):

```ts
/** Single source of truth for placing the live terminal in the photo's CRT glass,
 * and for the zoom-in framing. All cutout values are % of the chassis image. */
export const CUTOUT = { left: 41.4, top: 35.0, width: 12.5, height: 14.5 } as const;

/** The terminal is authored at this logical width and scaled to fit the cutout. */
export const TERM_LOGICAL_WIDTH = 600;

/** Zoom-in transform: keeps the whole computer (incl. keyboard) in frame. */
export const ZOOM = {
  originX: 50, originY: 46,      // transform-origin %
  translateX: 0, translateY: 4, // %
  scale: 1.8,
} as const;

/** Scene fills the viewport at the image's aspect ratio. */
export const IMAGE_ASPECT = "1536 / 1024";
```

- [ ] **Step 2: Verify** `npm run typecheck` → PASS.
- [ ] **Step 3: Commit** `git add src/components/retro/cutout.ts && git commit -m "feat: retro CRT cutout + zoom constants"`

### Task 2: Restructure root layout (de-globalize chrome)

**Files:** Modify `src/app/layout.tsx`

The current layout globally renders `<ParticleField/>`, `<Nav/>`, `<Footer/>`, `<PageTransition>`. These must NOT apply to the landing. Make the root minimal.

- [ ] **Step 1: Rewrite `layout.tsx`** to:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/content/site";
import { WarpProvider } from "@/components/retro/WarpOverlay";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["500","600","700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s · ${site.name}` },
  description: "Builder and founder shipping software products end to end — Parahealth, Claruss, and more.",
  openGraph: { type: "website", siteName: site.name, url: site.url },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <WarpProvider>{children}</WarpProvider>
      </body>
    </html>
  );
}
```

> Note: `WarpProvider` (Task 12) renders the children + the global `WarpOverlay` canvas and supplies the `useWarp()` context. It must exist before this compiles — until Task 12, temporarily `export function WarpProvider({children}){return <>{children}</>}` is fine, but the plan order builds Task 12 before wiring `TransitionLink`, and this task only needs the import to resolve. Create a minimal stub now if needed (see Step 2).

- [ ] **Step 2: If `WarpOverlay` doesn't exist yet, create a stub** so the app compiles:
`src/components/retro/WarpOverlay.tsx`:
```tsx
"use client";
import type { ReactNode } from "react";
export function WarpProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
```
(Task 12 replaces this with the real implementation.)

- [ ] **Step 3: Verify** `npm run typecheck && npm run build` → PASS (landing still renders old home for now; nav/footer/field gone globally — that's expected).
- [ ] **Step 4: Commit** `git add src/app/layout.tsx src/components/retro/WarpOverlay.tsx && git commit -m "refactor: minimal root layout, mount WarpProvider (stub)"`

### Task 3: Project-page segment chrome (`work/layout.tsx`)

**Files:** Create `src/app/work/layout.tsx`

Project pages need the particle field background + a back bar + footer (which used to be global).

- [ ] **Step 1: Implement**:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ParticleField } from "@/components/visuals/ParticleField";
import { Footer } from "@/components/layout/Footer";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ParticleField />
      <header className="mx-auto w-full max-w-5xl px-6 pt-7">
        <Link href="/" className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          ← work
        </Link>
      </header>
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify** `npm run typecheck && npm run build` → PASS; visit `/work/parahealth` in `npm run dev` — particle field shows, back link present.
- [ ] **Step 3: Commit** `git add src/app/work/layout.tsx && git commit -m "feat: project-page chrome (particle field + back bar + footer)"`

### Task 4: Image credit file

**Files:** Create `public/retro/CREDIT.md`

- [ ] **Step 1:** Write a short note:
```md
# machine.png
Owner-supplied photo of a vintage micro-computer used as the landing chassis.
TODO(owner): confirm source + license is cleared for commercial/portfolio use, and record it here.
```
- [ ] **Step 2: Commit** `git add public/retro/CREDIT.md && git commit -m "docs: retro asset credit placeholder"`

---

## Chunk 2: Pure modules (TDD)

### Task 5: `FileItem` mapping (TDD)

**Files:** Create `src/content/file-items.ts`, `tests/unit/file-items.test.ts`

- [ ] **Step 1: Write the failing test** `tests/unit/file-items.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

describe("toFileItems", () => {
  const items = toFileItems(projects, site);
  it("emits one file per project plus a resume file, in order", () => {
    expect(items.slice(0, projects.length).map((i) => i.href)).toEqual(projects.map((p) => `/work/${p.slug}`));
    const resume = items[items.length - 1];
    expect(resume.label).toMatch(/resume\.pdf/i);
    expect(resume.href).toBe("/resume");
  });
  it("labels project files <slug>.tsx with a short single-segment category comment", () => {
    const first = items[0];
    expect(first.label).toBe(`${projects[0].slug}.tsx`);
    expect(first.comment.length).toBeGreaterThan(0);
    expect(first.comment).not.toMatch(/[·,/]/); // short tag, not the full category string
  });
  it("every item carries a name used for the warp destination label", () => {
    for (const it of items) expect(it.name.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run** `npm test -- file-items` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/content/file-items.ts`:

```ts
import type { Project, SiteConfig } from "./projects.types";

export type FileItem = {
  name: string;     // e.g. "Parahealth" (destination/H1 label)
  label: string;    // e.g. "parahealth.tsx" (filename shown on the CRT)
  comment: string;  // e.g. "healthcare" (trailing // comment)
  href: string;     // e.g. "/work/parahealth"
};

/** Maps projects (+ resume) to the files shown on the CRT, in display order. */
export function toFileItems(projects: Project[], site: SiteConfig): FileItem[] {
  // short trailing-comment tag: first segment of the category (split on · , /)
  const shortTag = (category: string) => category.split(/[·,/]/)[0].trim().toLowerCase();
  const projectFiles: FileItem[] = projects.map((p) => ({
    name: p.name,
    label: `${p.slug}.tsx`,
    comment: shortTag(p.category),
    href: `/work/${p.slug}`,
  }));
  const resume: FileItem = { name: "Résumé", label: "resume.pdf", comment: "doc", href: "/resume" };
  return [...projectFiles, resume];
}
```

- [ ] **Step 4: Run** `npm test -- file-items` → PASS.
- [ ] **Step 5: Commit** `git add src/content/file-items.ts tests/unit/file-items.test.ts && git commit -m "feat: CRT file-item mapping + tests"`

### Task 6: Warp/star math (TDD)

**Files:** Create `src/components/retro/warp-field.ts`, `tests/unit/warp-field.test.ts`

- [ ] **Step 1: Write the failing test** `tests/unit/warp-field.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ramp, starCount, seedStars, stepStar, type Star } from "@/components/retro/warp-field";

describe("ramp", () => {
  it("is a smoothstep from 0 to 1", () => {
    expect(ramp(0)).toBeCloseTo(0);
    expect(ramp(1)).toBeCloseTo(1);
    expect(ramp(0.5)).toBeCloseTo(0.5, 1);
    expect(ramp(0.25)).toBeLessThan(0.25); // ease-in first half
  });
});
describe("starCount", () => {
  it("scales with area and is capped at 3200", () => {
    expect(starCount(1280, 720, 1)).toBeGreaterThan(0);
    expect(starCount(10000, 10000, 2)).toBeLessThanOrEqual(3200);
  });
});
describe("seedStars / stepStar", () => {
  it("seeds n finite stars and advances z toward the viewer", () => {
    const stars: Star[] = seedStars(20, 800, 600, () => 0.5);
    expect(stars).toHaveLength(20);
    const s = { ...stars[0] };
    const z0 = s.z;
    expect(stepStar(s, 50, 800, 600, () => 0.5)).toBe(false); // not respawned
    expect(s.z).toBeLessThan(z0);       // moves closer
    expect(Number.isFinite(s.x)).toBe(true);
  });
  it("reports respawn and stays finite when a star passes the viewer", () => {
    const s = { x: 10, y: 10, z: 5, pz: 0, b: 0.5 };
    expect(stepStar(s, 9999, 800, 600, () => 0.5)).toBe(true); // crossed the near plane → respawn
    expect(Number.isFinite(s.z)).toBe(true);
    expect(s.z).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run** `npm test -- warp-field` → FAIL.

- [ ] **Step 3: Implement** `src/components/retro/warp-field.ts` (port the prototype's math, DOM-free):

```ts
export type Star = { x: number; y: number; z: number; pz: number; b: number };

/** smoothstep-ish ease used for the warp acceleration. */
export function ramp(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const CAP = 3200;
export function starCount(w: number, h: number, dpr: number): number {
  return Math.min(CAP, Math.max(40, Math.round((w * h) / (2400 * Math.max(1, dpr)))));
}

export function makeStar(w: number, h: number, spread: boolean, rand: () => number): Star {
  return { x: (rand() * 2 - 1) * w, y: (rand() * 2 - 1) * h, z: spread ? rand() * w : w, pz: 0, b: 0.45 + rand() * 0.55 };
}
export function seedStars(n: number, w: number, h: number, rand: () => number = Math.random): Star[] {
  const out: Star[] = [];
  for (let i = 0; i < n; i++) out.push(makeStar(w, h, true, rand));
  return out;
}
/** Advance one star by `speed`; respawn at the far plane if it passes the viewer.
 * Returns true if it respawned this frame — the caller must SKIP drawing it that
 * frame (a fresh star has pz=0, which would make the streak projection divide by 0). */
export function stepStar(s: Star, speed: number, w: number, h: number, rand: () => number = Math.random): boolean {
  s.pz = s.z;
  s.z -= speed;
  if (s.z < 1) { Object.assign(s, makeStar(w, h, false, rand)); return true; }
  return false;
}
```

- [ ] **Step 4: Run** `npm test -- warp-field` → PASS.
- [ ] **Step 5: Commit** `git add src/components/retro/warp-field.ts tests/unit/warp-field.test.ts && git commit -m "feat: pure warp-field math + tests"`

---

## Chunk 3: CRT terminal + intro + legend

> Reference the prototype `docs/superpowers/reference/burnsos-landing-prototype.html` for exact styling/markup. Port its inline CSS into Tailwind classes or a scoped `<style>`/module as convenient; values must match the spec's "Finalized interaction" section.

### Task 7: `Legend` component

**Files:** Create `src/components/retro/Legend.tsx`

- [ ] **Step 1: Implement** — frameless retro legend with two states driven by a `zoomed` prop:

```tsx
const ITEMS_REST = [{ b: "Press Enter", rest: " to zoom" }];
const ITEMS_ZOOM = [
  { b: "Arrow keys", rest: " — navigate" },
  { b: "Enter", rest: " — open" },
  { b: "Esc", rest: " — back" },
];

export function Legend({ zoomed }: { zoomed: boolean }) {
  const items = zoomed ? ITEMS_ZOOM : ITEMS_REST;
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed z-40 flex flex-col font-[family-name:var(--font-mono)] uppercase",
        "text-[11px] tracking-[0.16em] text-[#6f6655]",
        zoomed
          ? "left-[15vw] top-1/2 -translate-y-1/2 items-start gap-[13px]"
          : "left-1/2 bottom-[19vh] -translate-x-1/2 items-center gap-[9px]",
      ].join(" ")}
    >
      {items.map((it, i) => (
        <span key={it.b} style={zoomed ? { animation: `legendfade .5s ease ${0.1 + i * 0.14}s both` } : undefined}>
          <b className="font-semibold text-[#3a3128]">{it.b}</b>
          {it.rest}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2:** Add the keyframe to `globals.css` (Chunk-1 region):
```css
@keyframes legendfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
```
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint` → PASS.
- [ ] **Step 4: Commit** `git add src/components/retro/Legend.tsx src/app/globals.css && git commit -m "feat: retro command legend (plinth / left states)"`

### Task 8: `IntroOverlay` component

**Files:** Create `src/components/retro/IntroOverlay.tsx`

Two-line typewriter that auto-dissolves; respects reduced motion (instant text + immediate reveal); click skips.

- [ ] **Step 1: Implement**:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const L1 = "Hi, I'm Dylan";
const L2 = "I like to build things";

/** Full-screen intro: types two lines, blinks ~2s each, then dissolves away.
 * Calls onDone when dissolved (parent can then enable the scene). */
export function IntroOverlay({ onDone }: { onDone?: () => void }) {
  const reduce = useReducedMotion();
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [active2, setActive2] = useState(false);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(false);

  const finish = () => { if (doneRef.current) return; doneRef.current = true; setGone(true); setTimeout(() => onDone?.(), 1000); };

  useEffect(() => {
    if (reduce) { setT1(L1); setT2(L2); setActive2(true); const id = setTimeout(finish, 1200); return () => clearTimeout(id); }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = (text: string, set: (s: string) => void, done: () => void) => {
      let i = 0;
      const step = () => { if (i <= text.length) { set(text.slice(0, i++)); timers.push(setTimeout(step, 30 + Math.random() * 45)); } else timers.push(setTimeout(done, 2000)); };
      step();
    };
    type(L1, setT1, () => { setActive2(true); type(L2, setT2, finish); });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <div
      onClick={finish}
      className={`fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center gap-8 px-6 text-center transition-opacity duration-1000 ${gone ? "pointer-events-none opacity-0" : ""}`}
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#d6d2cf 55%,#ece9e6 100%)" }}
    >
      <div className="text-[clamp(20px,4vw,42px)] leading-[1.3] tracking-tight text-[#1a1a1a]">
        <div className="min-h-[1.3em] whitespace-nowrap">{t1}<span className="hcaret" style={{ visibility: active2 ? "hidden" : "visible" }} /></div>
        <div className="min-h-[1.3em] whitespace-nowrap">{t2}<span className="hcaret" style={{ visibility: active2 ? "visible" : "hidden" }} /></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Add caret styles to `globals.css`:
```css
.hcaret { display:inline-block; width:9px; height:1em; margin-left:2px; transform:translateY(2px); background:#1a1a1a; animation:blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
```
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint` → PASS.
- [ ] **Step 4: Commit** `git add src/components/retro/IntroOverlay.tsx src/app/globals.css && git commit -m "feat: intro typewriter overlay (auto-dissolve, reduced-motion safe)"`

### Task 9: `CrtScreen` component

**Files:** Create `src/components/retro/CrtScreen.tsx`

Green phosphor terminal: header, line-number gutter, `> ls ./work`, and the file list. The list items are real links (rendered by the parent via a render-prop or by passing `TransitionLink`), with a `selected` index for keyboard roving. Scanlines/vignette via overlays.

- [ ] **Step 1: Implement** (presentational; selection + activation handled by parent):

```tsx
"use client";

import type { FileItem } from "@/content/file-items";
import type { ReactNode } from "react";

export function CrtScreen({
  items, selected, onHover, renderItem,
}: {
  items: FileItem[];
  selected: number;
  onHover: (i: number) => void;
  renderItem: (item: FileItem, i: number, selected: boolean) => ReactNode; // parent wraps in TransitionLink
}) {
  return (
    <div className="crt-term relative font-[family-name:var(--font-mono)]" style={{ width: 600 }}>
      <div className="flex border-b border-[rgba(100,240,160,.18)] pb-[14px] text-[13px] text-[#3f8f5e]">
        <span>burnsOS v1.0 — work.ts</span><span className="ml-auto">READY</span>
      </div>
      <div className="flex pt-4 text-[15px]">
        <div className="min-w-[42px] border-r border-[rgba(100,240,160,.14)] text-right text-[#2c6b45]">
          {Array.from({ length: items.length + 2 }, (_, i) => <div key={i} className="px-3 leading-[2]">{i + 1}</div>)}
        </div>
        <div className="flex-1 px-4 leading-[2]">
          <div className="text-[#3f8f5e]">&gt; ls ./work</div>
          <div className="mt-3">
            {items.map((it, i) => (
              <div key={it.href} onMouseEnter={() => onHover(i)}>
                {renderItem(it, i, i === selected)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Add CRT text + scanline styles to `globals.css`:
```css
.crt-term { color:#7bf0a6; text-shadow:0 0 5px rgba(100,240,160,.5); }
.crt-glass::before { content:""; position:absolute; inset:0; z-index:5; pointer-events:none; background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.22) 2px 3px); }
.crt-glass::after  { content:""; position:absolute; inset:0; z-index:6; pointer-events:none; background:radial-gradient(130% 130% at 50% 50%, transparent 60%, rgba(0,0,0,.6) 100%); }
.crt-file { display:flex; gap:14px; padding:8px 12px; margin:2px -12px; border-radius:6px; color:#5fcf86; text-decoration:none; }
.crt-file .nm { color:#a6ffcb; } .crt-file .cmt { margin-left:auto; color:#3f8f5e; }
.crt-file.sel { background:rgba(100,240,160,.14); color:#c9ffe0; }
.crt-file.sel .pre { color:#a6ffcb; } .crt-file .pre { width:1ch; color:#2c6b45; }
```
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint` → PASS.
- [ ] **Step 4: Commit** `git add src/components/retro/CrtScreen.tsx src/app/globals.css && git commit -m "feat: green CRT terminal screen"`

---

## Chunk 4: Warp transition

### Task 10: Warp pure module is done (Task 6). Build `WarpOverlay` + provider

**Files:** Modify `src/components/retro/WarpOverlay.tsx` (replace the stub)

- [ ] **Step 1: Implement** the provider, context, and canvas. `play(href)` runs the warp then calls `router.push(href)` at the cover moment and finishes with the destination mount-in (handled by the destination page's own fade-in). Reduced motion → immediate push.

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ramp, seedStars, starCount, stepStar, type Star } from "./warp-field";

type WarpCtx = { play: (href: string) => void };
const Ctx = createContext<WarpCtx>({ play: () => {} });
export const useWarp = () => useContext(Ctx);

const DUR = 2200;

export function WarpProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const rafRef = useRef(0);

  const play = useCallback((href: string) => {
    if (reduce) { router.push(href); return; }
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) { router.push(href); return; }
    setActive(true);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = Math.floor(innerWidth * dpr));
    const H = (canvas.height = Math.floor(innerHeight * dpr));
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    const cx = W / 2, cy = H / 2;
    let stars: Star[] = seedStars(starCount(W, H, dpr), W, H);
    let pushed = false;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR), e = ramp(t);
      const speed = 4 + e * 340, fov = 1 + e * 1.15;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${0.34 - e * 0.28})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (const s of stars) {
        if (stepStar(s, speed, W, H)) continue; // respawned this frame → skip drawing (pz=0)
        const sx = cx + (s.x / s.z) * W * fov, sy = cy + (s.y / s.z) * H * fov;
        const px = cx + (s.x / s.pz) * W * fov, py = cy + (s.y / s.pz) * H * fov;
        const k = 1 - s.z / W;
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, (0.12 + k * 0.95) * s.b)})`;
        ctx.lineWidth = Math.max(dpr * 0.5, k * k * 3.4 * dpr);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      if (!pushed && t > 0.62) { pushed = true; router.push(href); } // cover moment
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); setActive(false); }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [reduce, router]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <Ctx.Provider value={{ play }}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300"
        style={{ opacity: active ? 1 : 0 }}
      />
    </Ctx.Provider>
  );
}
```

- [ ] **Step 2: Verify** `npm run typecheck && npm run lint && npm run build` → PASS.
- [ ] **Step 3: Commit** `git add src/components/retro/WarpOverlay.tsx && git commit -m "feat: lightspeed WarpOverlay + context"`

### Task 11: `TransitionLink`

**Files:** Create `src/components/retro/TransitionLink.tsx`

- [ ] **Step 1: Implement** — renders a real `<a>`/`Link` (SSR/crawlable); on click, prevents default and runs the warp:

```tsx
"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useWarp } from "./WarpOverlay";

export function TransitionLink({ href, children, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { play } = useWarp();
  return (
    <Link
      href={href}
      onClick={(e) => {
        // let modified clicks / new-tab behave normally
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        play(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Verify** `npm run typecheck && npm run lint` → PASS.
- [ ] **Step 3: Commit** `git add src/components/retro/TransitionLink.tsx && git commit -m "feat: TransitionLink (warp then navigate)"`

---

## Chunk 5: RetroComputer + landing wiring

### Task 12: `RetroComputer` (the scene)

**Files:** Create `src/components/retro/RetroComputer.tsx`

Composes everything: intro → photo scene (cover-sized) with the CRT terminal in the cutout → zoom state → keyboard + selection → legend + back-out. The terminal is scaled to fit the cutout via a measured ref.

- [ ] **Step 1: Implement**:

```tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CUTOUT, IMAGE_ASPECT, TERM_LOGICAL_WIDTH, ZOOM } from "./cutout";
import { CrtScreen } from "./CrtScreen";
import { IntroOverlay } from "./IntroOverlay";
import { Legend } from "./Legend";
import { TransitionLink } from "./TransitionLink";
import { useWarp } from "./WarpOverlay";
import type { FileItem } from "@/content/file-items";

export function RetroComputer({ items }: { items: FileItem[] }) {
  const [intro, setIntro] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [sel, setSel] = useState(0);
  const crtRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const { play } = useWarp();

  // scale the fixed-width terminal to fit the cutout (unzoomed)
  const fitTerm = useCallback(() => {
    const crt = crtRef.current, term = termRef.current;
    if (!crt || !term) return;
    if (!zoomed) term.style.transform = `scale(${crt.getBoundingClientRect().width / TERM_LOGICAL_WIDTH})`;
  }, [zoomed]);
  useEffect(() => { fitTerm(); addEventListener("resize", fitTerm); return () => removeEventListener("resize", fitTerm); }, [fitTerm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (intro) return; // intro handles its own Enter via overlay click/keyboard? keep simple: ignore
      if (e.key === "Escape") { if (zoomed) setZoomed(false); return; }
      if (!zoomed) { if (e.key === "Enter") { e.preventDefault(); setZoomed(true); } return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % items.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + items.length) % items.length); }
      else if (e.key === "Enter") { e.preventDefault(); play(items[sel].href); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [intro, zoomed, sel, items, play]);

  const zoomStyle = zoomed
    ? { transform: `translate(${ZOOM.translateX}%, ${ZOOM.translateY}%) scale(${ZOOM.scale})` }
    : undefined;

  return (
    <main
      className="relative flex h-dvh items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#cecac7 38%,#ddd9d6 68%,#ece9e6 100%)" }}
    >
      {intro && <IntroOverlay onDone={() => setIntro(false)} />}

      <div
        className="relative transition-transform duration-[1150ms] [transition-timing-function:cubic-bezier(.7,0,.18,1)]"
        style={{ width: "max(100vw, calc(100vh * 1536 / 1024))", aspectRatio: IMAGE_ASPECT, transformOrigin: `${ZOOM.originX}% ${ZOOM.originY}%`, ...zoomStyle }}
      >
        <Image src="/retro/machine.png" alt="A vintage micro-computer on a plinth" fill priority sizes="100vw" className="object-cover select-none" />
        <div
          ref={crtRef}
          className="crt-glass absolute cursor-pointer overflow-hidden rounded-[14px/11px] bg-[#020402]"
          style={{ left: `${CUTOUT.left}%`, top: `${CUTOUT.top}%`, width: `${CUTOUT.width}%`, height: `${CUTOUT.height}%` }}
          onClick={() => !zoomed && setZoomed(true)}
        >
          <div ref={termRef} className="absolute left-0 top-0 origin-top-left p-[26px_26px_18px]">
            <CrtScreen
              items={items}
              selected={sel}
              onHover={(i) => zoomed && setSel(i)}
              renderItem={(it, i, selected) => (
                <TransitionLink href={it.href} tabIndex={zoomed ? 0 : -1}
                  className={`crt-file ${selected ? "sel" : ""}`} aria-label={`Open ${it.name}`}>
                  <span className="pre">&gt;</span><span className="nm">{it.label}</span><span className="cmt">{it.comment}</span>
                </TransitionLink>
              )}
            />
          </div>
        </div>
      </div>

      {!intro && (
        <>
          <Legend zoomed={zoomed} />
          {zoomed && (
            <button onClick={() => setZoomed(false)}
              className="fixed left-[18px] top-[18px] z-40 rounded-md border border-[#aaa] bg-white/80 px-3 py-[7px] font-[family-name:var(--font-mono)] text-xs text-[#234]">
              ← back out
            </button>
          )}
        </>
      )}
    </main>
  );
}
```

> Note on intro+Enter: the `IntroOverlay` dissolves automatically and on click. Pressing Enter during the intro is a nice-to-have; keep the intro self-contained (auto + click) to avoid double-Enter complexity. If desired later, lift an `onEnter` from IntroOverlay.

- [ ] **Step 2: Verify** `npm run typecheck && npm run lint` → PASS.
- [ ] **Step 3: Commit** `git add src/components/retro/RetroComputer.tsx && git commit -m "feat: RetroComputer scene (intro, cutout terminal, zoom, keyboard)"`

### Task 13: Wire the landing page

**Files:** Modify `src/app/page.tsx`

- [ ] **Step 1: Replace** with:

```tsx
import { RetroComputer } from "@/components/retro/RetroComputer";
import { toFileItems } from "@/content/file-items";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export default function HomePage() {
  return <RetroComputer items={toFileItems(projects, site)} />;
}
```

- [ ] **Step 2: Verify** `npm run typecheck && npm run lint && npm run build` → PASS. In `npm run dev`: intro types + dissolves, machine shows with green terminal in the CRT, Enter/click zooms, ↑/↓ + Enter opens with the warp, Esc backs out.
- [ ] **Step 3: Commit** `git add src/app/page.tsx && git commit -m "feat: burnsOS retro landing"`

### Task 14: Delete superseded home components

**Files:** Delete the unused home + transition components.

- [ ] **Step 1:** `git rm src/components/home/Hero.tsx src/components/home/ProjectGrid.tsx src/components/home/ProjectCarousel.tsx src/components/home/ProjectCardBody.tsx src/components/home/AboutSection.tsx src/components/ui/MagneticButton.tsx src/components/motion/PageTransition.tsx`
- [ ] **Step 2:** `grep -rn "Hero\|ProjectGrid\|ProjectCarousel\|ProjectCardBody\|AboutSection\|MagneticButton\|PageTransition" src/` — fix any dangling imports (there should be none after Tasks 2 & 13).
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint && npm run build` → PASS.
- [ ] **Step 4: Commit** `git add -A && git commit -m "chore: remove home/carousel/about + PageTransition superseded by burnsOS"`

---

## Chunk 6: Project page template (B&W + particle field)

### Task 15: Restyle project components to B&W mono

**Files:** Modify `src/components/project/ProjectHero.tsx`, `BuildStory.tsx`, `Gallery.tsx`, `BrowserFrame.tsx`, `PhoneFrame.tsx`, `ProjectPager.tsx`, `ActionButtons.tsx`

Match `docs/superpowers/reference/burnsos-landing-prototype.html` destination styling + the project-template look: white-on-near-black, mono eyebrows/labels, hairline frames, NO gradient. Content/data and `ActionButtons` labels unchanged (e2e depends on labels).

- [ ] **Step 1:** `ProjectHero.tsx` — remove `text-gradient` from the `<h1>` (plain white); keep mono `SectionLabel`. The page background is the particle field (from `work/layout.tsx`); ensure hero text sits above it (it does; field is `-z-10`).
- [ ] **Step 2:** `BuildStory.tsx`, `ProjectPager.tsx` — already mono via `SectionLabel`/prior work; ensure no gradient remains; pager labels mono (from earlier chunk). Make sections sit on the particle background (translucent surfaces ok).
- [ ] **Step 3:** `Gallery.tsx`/`BrowserFrame.tsx`/`PhoneFrame.tsx` — keep hairline frames; confirm captions mono; no gradient.
- [ ] **Step 4:** `ActionButtons.tsx` — leave labels; the `Button` primary may keep a subtle treatment but drop gradient tint to stay B&W (set primary to a white/hairline style). Do NOT rename labels.
- [ ] **Step 5: Verify** `npm run typecheck && npm run lint && npm run build` → PASS; visit each `/work/<slug>` in dev — B&W, particle field behind, readable.
- [ ] **Step 6: Commit** `git add src/components/project/ && git commit -m "style: project pages — B&W mono over particle field"`

### Task 16: Destination mount-in animation

**Files:** Modify `src/app/work/[slug]/page.tsx` (wrap content) or add a small client wrapper `src/components/project/MountIn.tsx`

The warp "flies into" the page; the destination should scale/fade in on mount (reduced-motion: none).

- [ ] **Step 1: Create** `src/components/project/MountIn.tsx`:
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export function MountIn({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>{children}</motion.div>;
}
```
- [ ] **Step 2:** Wrap the `<main>` contents of `work/[slug]/page.tsx` in `<MountIn>…</MountIn>`.
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint && npm run build` → PASS; warp from landing → project lands with a subtle scale/fade.
- [ ] **Step 4: Commit** `git add src/components/project/MountIn.tsx "src/app/work/[slug]/page.tsx" && git commit -m "feat: project page mount-in (fly-into landing)"`

### Task 17: Resume + 404 (B&W terminal)

**Files:** Modify `src/app/resume/page.tsx`, `src/app/not-found.tsx`

- [ ] **Step 1:** `resume/page.tsx` — plain B&W mono (drop any gradient on the `<h1>`); keep the PDF iframe + Download/Open buttons; keep a `← work` link home.
- [ ] **Step 2:** `not-found.tsx` — terminal styling; keep `<h1>` text matching `/doesn.t exist/i`; add a mono `> file not found` flavor line; `← work` / "See the work" link.
- [ ] **Step 3: Verify** `npm run typecheck && npm run lint && npm run build` → PASS.
- [ ] **Step 4: Commit** `git add src/app/resume/page.tsx src/app/not-found.tsx && git commit -m "style: resume + 404 B&W terminal"`

---

## Chunk 7: Verification

### Task 18: Rewrite e2e for the retro landing + full gate

**Files:** Modify `tests/e2e/smoke.spec.ts`

The old home assertions (carousel/hero) no longer apply. Rewrite the home cases.

- [ ] **Step 1: Replace the two home-dependent tests** (`home page renders…` and `nav anchor links work`) with retro-landing tests. Keep the project-page, 404, and resume tests (the latter already points at `/resume`). New tests:

```ts
test("landing renders the machine and project files (no console errors)", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  // chassis image present (next/image encodes the src, so match by alt text, not path)
  await expect(page.getByRole("img", { name: /micro-computer/i })).toBeVisible();
  for (const s of SLUGS) await expect(page.locator(`a[href="/work/${s}"]`)).toHaveCount(1);
  await expect(page.locator('a[href="/resume"]')).toHaveCount(1);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("a project file navigates to its page", async ({ page }) => {
  await page.goto("/");
  // reduced-motion env (Playwright default) → TransitionLink falls back to direct nav
  await page.locator('a[href="/work/parahealth"]').click();
  await expect(page).toHaveURL(/\/work\/parahealth$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

> Note: Playwright does NOT default to reduced motion here, so adding `test.use({ reducedMotion: "reduce" })` (Step 2) is REQUIRED — it makes `TransitionLink`/`WarpOverlay` bypass the warp and navigate directly, so clicks are deterministic.
> Note: the retained resume test passes because the CRT resume file is a real `<a href="/resume">` with `aria-label="Open Résumé"` (from `aria-label={`Open ${it.name}`}`), which matches `getByRole("link", { name: /résumé|resume/i })`. Keep that aria-label so the test keeps matching.

- [ ] **Step 2: Add** `test.use({ reducedMotion: "reduce" });` near the top of `smoke.spec.ts` so transitions don't flake the suite.

- [ ] **Step 3: Run the full gate**:
`npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`
Expected: ALL PASS. Unit: `file-items`, `warp-field`, `particle-field`, `projects`. E2E on port 3100 all green.

- [ ] **Step 4: Manual acceptance** (dev): intro types two lines + dissolves; machine fills viewport; Enter/click zooms keeping whole computer in frame; ↑/↓ + Enter fires the lightspeed warp and flies into the project page; Esc backs out; `prefers-reduced-motion` ON → no typewriter/warp, links navigate instantly; project pages show particle field + B&W; resize holds; no console errors.

- [ ] **Step 5: Commit** `git add tests/e2e/smoke.spec.ts && git commit -m "test: e2e for burnsOS retro landing + warp navigation"`

### Task 19: Update project memory

- [ ] **Step 1:** After merge, update memory: landing is now the burnsOS retro-computer (`src/components/retro/*`, photo at `public/retro/machine.png`, cutout in `cutout.ts`); warp transition via `WarpOverlay`/`TransitionLink`; project pages are B&W + `ParticleField` (in `work/layout.tsx`); home/carousel/about + `PageTransition` removed. Update `ui-vectored-space.md` (or add `burnsos-landing.md`) + the `MEMORY.md` pointer.

---

## Notes for the implementer

- **Match the prototype** (`docs/superpowers/reference/burnsos-landing-prototype.html`) for exact look/feel and any value not restated here.
- **Don't touch `src/content/` data** or rename `ActionButtons` labels (e2e depends on them).
- **Reduced motion is non-negotiable:** `IntroOverlay`, `WarpOverlay`/`TransitionLink`, `MountIn`, and `ParticleField` all degrade. Verify with the OS setting.
- **Accessibility:** CRT files are real `<a>`; roving ↑/↓ + Enter; visible focus; canvas + scanline layers `aria-hidden`; image has alt text.
- **SSR/no-JS:** links work without JS; project pages server-render; the machine image and file links are crawlable.
- **The CRT cutout is fragile by nature** — only ever position the terminal from `cutout.ts` against a container that preserves the image aspect ratio; never use a mismatched `object-fit` box.
- **Mobile/portrait** (spec): below a breakpoint, prefer detaching the terminal into a full-width B&W panel rather than relying on the tiny embedded screen. (Can be a follow-up task if out of scope for first pass — if so, `log` that it's deferred.)
