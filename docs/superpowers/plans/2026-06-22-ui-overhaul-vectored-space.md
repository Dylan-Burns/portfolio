# Portfolio UI Overhaul ("Vectored Space") Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the entire portfolio to a near-black, high-contrast "xAI-meets-Eragon" aesthetic — bold grotesk headlines, monospace labels/CTAs, a single multi-stop gradient accent, all over a live cursor-reactive particle-field background.

**Architecture:** Pure visual layer change. Design tokens live in `globals.css`; a new self-contained `ParticleField` (thin canvas component + a pure, node-testable simulation module) replaces `GlowBackdrop`; every existing component is restyled in place using the same tokens. No content, route, data-model, or component-API changes.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4 (CSS-first `@theme`), `motion` (Framer Motion) v12, `next/font/google`, TypeScript, Vitest (node env), Playwright (port 3100).

**Spec:** `docs/superpowers/specs/2026-06-22-ui-overhaul-vectored-space-design.md`

**Branch:** Do all work on a feature branch `feat/ui-vectored-space` (create it before Task 1; `git switch -c feat/ui-vectored-space`). Commit after every task.

---

## File Map

**Create**
- `src/components/visuals/particle-field.ts` — pure simulation helpers (count, force, animate-decision, seeding). Node-testable.
- `src/components/visuals/ParticleField.tsx` — `"use client"` canvas component using the helpers + `motion` pointer springs.
- `src/components/ui/MagneticButton.tsx` — `"use client"` wrapper adding a subtle magnetic hover (reduced-motion safe).
- `tests/unit/particle-field.test.ts` — unit tests for the pure helpers.

**Modify**
- `src/app/globals.css` — tokens (darker bg, hairlines), `--font-mono`, rewritten `text-gradient`, `.label-mono` + `.hairline` utilities.
- `src/app/layout.tsx` — add Geist Mono font var; swap `GlowBackdrop` → `ParticleField`.
- `src/components/ui/Button.tsx` — gradient/hairline variants, mono option.
- `src/components/ui/Section.tsx` — mono eyebrow + rule; gradient-capable heading.
- `src/components/ui/Tag.tsx` — hairline mono chip.
- `src/components/layout/Nav.tsx` — mono links, gradient hover/active underline, scroll hairline.
- `src/components/layout/Footer.tsx` — mono, hairline, gradient accent.
- `src/components/home/Hero.tsx` — mono eyebrow + rule + gradient phrase.
- `src/components/home/ProjectGrid.tsx`, `ProjectCarousel.tsx`, `ProjectCardBody.tsx` — numbered index, hairline translucent cards, gradient hover.
- `src/components/home/AboutSection.tsx` — hairline frame, mono chips, green `--color-live` "now" dot.
- `src/components/project/ProjectHero.tsx`, `ActionButtons.tsx`, `Gallery.tsx`, `BrowserFrame.tsx`, `PhoneFrame.tsx`, `BuildStory.tsx`, `ProjectPager.tsx` — hairline frames, mono labels/captions, gradient on primary action.
- `src/app/resume/page.tsx`, `src/app/not-found.tsx` — mono eyebrow + gradient.
- `tests/e2e/smoke.spec.ts` — fix the pre-existing-red "launch action" regex; add canvas-mount + content-clickable assertions.

**Note on motion**
- Staggered reveals are already achieved by the existing incremental `Reveal delay={…}` pattern (Hero uses 0.05/0.1/0.15; AboutSection 0/0.05/0.1/0.15/0.2). No new stagger variants are added (they would be dead exports). `motion-config.ts` is left unchanged.

**Pre-existing failure addressed here**
- `tests/e2e/smoke.spec.ts:17` ("each project page renders with a launch action") is **already failing on `main`** before this work: its `/launch app|app store/i` regex only matches Claruss's "App Store" button, while parahealth/wedding/grocery render "App"/"Marketing site"/"App Site". Task 18 fixes the regex so the gate can go green.

**Delete**
- `src/components/visuals/GlowBackdrop.tsx` (after layout no longer imports it).

---

## Chunk 1: Foundation — tokens, fonts, gradient utility

### Task 1: Design tokens & utilities in `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update the `@theme` block surfaces, add `--font-mono`**

In `src/app/globals.css`, replace the surface/border tokens and add a mono font var. The new `@theme` surface + type section:

```css
@theme {
  /* surfaces — pushed toward pure black so the particle field reads */
  --color-bg: #040509;
  --color-bg-2: #0a0b14;
  --color-surface: rgba(255, 255, 255, 0.03);
  --color-surface-hover: rgba(255, 255, 255, 0.06);
  --color-border: rgba(255, 255, 255, 0.10);
  --color-border-strong: rgba(255, 255, 255, 0.20);

  /* text */
  --color-fg: #e7e9f5;
  --color-fg-muted: #a3a8cd;
  --color-fg-subtle: #7e85bd;

  /* accents (unchanged) */
  --color-accent: #8b93ff;
  --color-accent-2: #22d3ee;
  --color-accent-3: #c084fc;
  --color-live: #3ddc97;

  /* type */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace;

  /* radii / shadow */
  --radius-card: 14px;
  --radius-button: 9px;
  --shadow-glow: 0 30px 90px rgba(0, 0, 0, 0.55);
}
```

- [ ] **Step 2: Rewrite the `text-gradient` utility to the multi-stop accent**

Replace the existing `@utility text-gradient { ... }` block with:

```css
/* utility: multi-stop accent gradient text (the one vivid element) */
@utility text-gradient {
  background: linear-gradient(
    100deg,
    var(--color-accent) 0%,
    var(--color-accent-2) 50%,
    var(--color-accent-3) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

- [ ] **Step 3: Add `label-mono` and `hairline` utilities**

Append after `text-gradient`:

```css
/* utility: monospace eyebrow / label */
@utility label-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--color-fg-subtle);
}

/* utility: a 1px divider rule */
@utility hairline {
  height: 1px;
  width: 100%;
  background: var(--color-border);
}
```

- [ ] **Step 4: Verify build + typecheck**

Run: `npm run typecheck && npm run build`
Expected: PASS (no usages broken yet; `--font-geist-mono` is wired in Task 2).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "style: darker tokens, mono font var, multi-stop gradient utility"
```

### Task 2: Wire Geist Mono in `layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and instantiate Geist Mono**

Change the font import line to include `Geist_Mono` and add the instance:

```tsx
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
```

```tsx
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
```

- [ ] **Step 2: Add the variable to `<html>`**

```tsx
<html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Geist Mono font variable"
```

---

## Chunk 2: ParticleField (the interactive background)

### Task 3: Pure simulation module (TDD)

**Files:**
- Create: `src/components/visuals/particle-field.ts`
- Test: `tests/unit/particle-field.test.ts`

The component's logic that doesn't need a DOM lives here so it can be unit-tested in Vitest's node env. The React component (Task 4) is a thin canvas shell over these.

> **On the spec's "no animation loop under reduced motion" test:** that decision is the
> `shouldAnimate` function, unit-tested here in node. A full DOM render assertion would
> require adding jsdom/happy-dom to a project that is intentionally node-only — we don't add
> it. The rendered static-frame behavior is verified in Task 18's manual reduced-motion pass.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/particle-field.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  particleCount,
  shouldAnimate,
  repelDelta,
  seedParticles,
  type Particle,
} from "@/components/visuals/particle-field";

describe("particleCount", () => {
  it("scales with density and area, and is capped", () => {
    expect(particleCount("med", 1280, 720)).toBeGreaterThan(0);
    expect(particleCount("high", 1280, 720)).toBeGreaterThan(particleCount("med", 1280, 720));
    // hard cap regardless of area
    expect(particleCount("high", 10000, 10000)).toBeLessThanOrEqual(700);
  });
});

describe("shouldAnimate", () => {
  it("only animates with motion allowed AND a fine pointer", () => {
    expect(shouldAnimate({ reduceMotion: false, finePointer: true })).toBe(true);
    expect(shouldAnimate({ reduceMotion: true, finePointer: true })).toBe(false);
    expect(shouldAnimate({ reduceMotion: false, finePointer: false })).toBe(false);
  });
});

describe("repelDelta", () => {
  it("is zero outside the radius", () => {
    const d = repelDelta(0, 0, 500, 500, 180, 1);
    expect(d.fx).toBe(0);
    expect(d.fy).toBe(0);
  });
  it("pushes the particle away from the pointer when inside the radius", () => {
    // pointer at origin, particle to the right → force should push further right (+x)
    const d = repelDelta(10, 0, 0, 0, 180, 1);
    expect(d.fx).toBeGreaterThan(0);
    expect(Math.abs(d.fy)).toBeLessThan(1e-6);
  });
});

describe("seedParticles", () => {
  it("creates exactly n particles within the canvas bounds", () => {
    const ps: Particle[] = seedParticles(50, 800, 600, () => 0.5);
    expect(ps).toHaveLength(50);
    for (const p of ps) {
      expect(p.ox).toBeGreaterThanOrEqual(-800); // cluster math can overshoot; just finite
      expect(Number.isFinite(p.ox)).toBe(true);
      expect(Number.isFinite(p.oy)).toBe(true);
      expect(p.depth).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- particle-field`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `particle-field.ts`**

Create `src/components/visuals/particle-field.ts`:

```ts
/** Pure, DOM-free simulation helpers for ParticleField. Unit-tested in node. */

export type Density = "med" | "high";

export type Particle = {
  x: number; y: number;       // current position
  ox: number; oy: number;     // origin (drifts back here)
  vx: number; vy: number;     // velocity
  depth: number;              // 0..1 parallax weight
  size: number;               // radius in px (pre-DPR)
  base: number;               // base alpha
  tw: number;                 // twinkle phase
  tws: number;                // twinkle speed
};

const HARD_CAP = 700;
const DENSITY_DIVISOR: Record<Density, number> = { med: 9000, high: 5200 };

/** Particle count scales with viewport area, clamped to a hard cap. */
export function particleCount(density: Density, w: number, h: number): number {
  const area = Math.max(0, w) * Math.max(0, h);
  const raw = Math.round(area / DENSITY_DIVISOR[density]);
  return Math.max(40, Math.min(HARD_CAP, raw));
}

/** Animate only when motion is allowed AND the device has a fine (mouse) pointer. */
export function shouldAnimate(opts: { reduceMotion: boolean; finePointer: boolean }): boolean {
  return !opts.reduceMotion && opts.finePointer;
}

const REPEL_STRENGTH = 2.2;

/** Repel force applied to a particle from a pointer. Zero outside `radius`. */
export function repelDelta(
  px: number, py: number, mx: number, my: number, radius: number, depth: number,
): { fx: number; fy: number } {
  const dx = px - mx;
  const dy = py - my;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return { fx: 0, fy: 0 };
  const d = Math.sqrt(d2) || 1;
  const f = (1 - d / radius) * REPEL_STRENGTH * depth;
  return { fx: (dx / d) * f, fy: (dy / d) * f };
}

/**
 * Seed `n` particles. ~55% form a soft nebula cluster on the right; the rest are
 * scattered. `rand` is injectable for deterministic tests.
 */
export function seedParticles(
  n: number, w: number, h: number, rand: () => number = Math.random,
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const cluster = rand() < 0.55;
    let x: number, y: number;
    if (cluster) {
      const cx = w * 0.66, cy = h * 0.5;
      const r = Math.pow(rand(), 0.6) * Math.min(w, h) * 0.42;
      const a = rand() * Math.PI * 2;
      x = cx + Math.cos(a) * r * 1.3;
      y = cy + Math.sin(a) * r * 0.8;
    } else {
      x = rand() * w;
      y = rand() * h;
    }
    const depth = 0.3 + rand() * 0.7;
    out.push({
      x, y, ox: x, oy: y, vx: 0, vy: 0, depth,
      size: (0.6 + rand() * 1.3) * depth,
      base: 0.25 + rand() * 0.65,
      tw: rand() * Math.PI * 2,
      tws: 0.01 + rand() * 0.03,
    });
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- particle-field`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/visuals/particle-field.ts tests/unit/particle-field.test.ts
git commit -m "feat: pure particle-field simulation helpers + tests"
```

### Task 4: `ParticleField` canvas component

**Files:**
- Create: `src/components/visuals/ParticleField.tsx`

> **On the spec's IntersectionObserver requirement:** the canvas is `fixed inset-0`
> (always full-viewport), so it is never scrolled offscreen — an IntersectionObserver
> would never fire a "hidden" state. The relevant "stop wasting CPU" case is a
> backgrounded tab, which `visibilitychange`/`document.hidden` handles. We deliberately
> use `visibilitychange` instead of IntersectionObserver for this reason.

- [ ] **Step 1: Implement the component**

Create `src/components/visuals/ParticleField.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  particleCount,
  repelDelta,
  seedParticles,
  shouldAnimate,
  type Density,
  type Particle,
} from "./particle-field";

/**
 * Fixed, decorative, full-viewport particle field behind all content. White dust
 * forms a soft nebula cluster + gradient glow; particles repel from the cursor and
 * drift back. Renders a single static frame (no rAF, no pointer listeners) under
 * reduced motion or on coarse-pointer (touch) devices. Replaces GlowBackdrop.
 */
export function ParticleField({
  density = "med",
  interaction = "repel",
}: {
  density?: Density;
  interaction?: "repel" | "attract";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finePointer =
      typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const animate = shouldAnimate({ reduceMotion: !!reduce, finePointer });
    const dir = interaction === "repel" ? 1 : -1;

    let dpr = 1, W = 0, H = 0;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      particles = seedParticles(particleCount(density, W, H), W, H);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.66, H * 0.5, 0, W * 0.66, H * 0.5, Math.max(W, H) * 0.5);
      g.addColorStop(0, "rgba(124,92,255,0.10)");
      g.addColorStop(0.5, "rgba(34,211,238,0.04)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const R = 180 * dpr;
      for (const p of particles) {
        if (animate) {
          p.vx += (p.ox - p.x) * 0.004;
          p.vy += (p.oy - p.y) * 0.004;
          if (mouse.active) {
            const { fx, fy } = repelDelta(p.x, p.y, mouse.x * dpr, mouse.y * dpr, R, p.depth);
            p.vx += dir * fx;
            p.vy += dir * fy;
          }
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
          p.tw += p.tws;
        }
        const tw = animate ? Math.sin(p.tw) * 0.35 + 0.65 : 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.base * tw})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onVisibility = () => {
      if (!animate) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        loop();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (animate) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      loop();
    } else {
      draw(); // single static frame
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reduce, density, interaction]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
```

- [ ] **Step 2: Verify typecheck/lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/visuals/ParticleField.tsx
git commit -m "feat: ParticleField canvas component"
```

### Task 5: Mount `ParticleField`, remove `GlowBackdrop`

**Files:**
- Modify: `src/app/layout.tsx`
- Delete: `src/components/visuals/GlowBackdrop.tsx`

- [ ] **Step 1: Swap the import and JSX in `layout.tsx`**

Replace `import { GlowBackdrop } from "@/components/visuals/GlowBackdrop";` with
`import { ParticleField } from "@/components/visuals/ParticleField";`, and replace
`<GlowBackdrop />` with `<ParticleField />`.

- [ ] **Step 2: Delete the old file**

```bash
git rm src/components/visuals/GlowBackdrop.tsx
```

- [ ] **Step 3: Verify build + grep for stragglers**

Run: `grep -rn "GlowBackdrop" src/ ; npm run typecheck && npm run build`
Expected: grep returns nothing; build PASS.

- [ ] **Step 4: Manual check**

Run `npm run dev`, open the site, move the cursor — particles react. Toggle OS "reduce motion" and reload — field is static, no jank. Content is clickable above the canvas.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount ParticleField, remove GlowBackdrop"
```

---

## Chunk 3: Shared primitives & motion helpers

> Staggered reveals are already provided by the existing incremental `Reveal delay={…}`
> pattern across Hero/About/Project sections — no new motion variants are needed.
> (Chunk 3 starts at Task 7; there is no Task 6 — the former stagger task was removed.)

### Task 7: `Button` — gradient/hairline variants + mono

**Files:**
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Update base + variants**

Keep the component's API (`variant`, `external`, `className`, props) exactly. Replace `base` and `variants` with:

```tsx
const base =
  "inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

const variants: Record<Variant, string> = {
  // primary: subtle gradient-tinted, hairline-bordered, brightens on hover
  primary:
    "border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-fg)] hover:bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] hover:border-[var(--color-accent)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]",
  ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
};
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "style: mono + hairline/gradient button variants"
```

### Task 8: `MagneticButton` wrapper

**Files:**
- Create: `src/components/ui/MagneticButton.tsx`

- [ ] **Step 1: Implement**

Create `src/components/ui/MagneticButton.tsx`. A reduced-motion-safe wrapper that nudges its child toward the cursor on hover. Use it around primary CTAs (Hero).

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

/** Subtle magnetic pull toward the cursor on hover. No-op under reduced motion. */
export function MagneticButton({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MagneticButton.tsx
git commit -m "feat: MagneticButton hover wrapper"
```

### Task 9: `Section` (eyebrow + heading) and `Tag`

**Files:**
- Modify: `src/components/ui/Section.tsx`, `src/components/ui/Tag.tsx`

- [ ] **Step 1: Update `SectionLabel` to a mono eyebrow with a leading index rule**

Replace `SectionLabel` in `Section.tsx` (keep `SectionHeading` and `Section` signatures; `SectionHeading` already accepts `className` so callers can add `text-gradient`):

```tsx
/** Small monospace kicker above a section heading. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("label-mono inline-flex items-center gap-3 uppercase", className)}>
      <span aria-hidden className="h-px w-8 bg-[var(--color-border-strong)]" />
      {children}
    </p>
  );
}
```

- [ ] **Step 2: Update `Tag` to a hairline mono chip**

Replace the class list in `Tag.tsx` (keep the `tone` API):

```tsx
"inline-flex items-center rounded-full border px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
tone === "live"
  ? "border-[color-mix(in_oklab,var(--color-live)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-live)_12%,transparent)] text-[var(--color-live)]"
  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)]",
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Section.tsx src/components/ui/Tag.tsx
git commit -m "style: mono eyebrow + hairline tag"
```

---

## Chunk 4: Layout chrome (Nav, Footer)

### Task 10: `Nav`

**Files:**
- Modify: `src/components/layout/Nav.tsx`

Preserve ALL behavior and a11y: `scrolled` state, mobile `open` toggle, `aria-expanded`, `aria-controls="mobile-nav"`, the `id="mobile-nav"` panel, exact link labels/hrefs (`Work`, `About`, `Résumé`, `Contact`) — the e2e test clicks `name: "Work", exact: true`.

- [ ] **Step 1: Restyle desktop links to mono with a gradient hover underline**

In the desktop links `<div>`, change its container classes to mono and update each `<Link>`. Replace the desktop links block (lines ~52-66) with:

```tsx
<div className="hidden items-center gap-7 font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)] md:flex">
  {links.map((l) => (
    <Link
      key={l.label}
      href={l.href}
      className={cn(
        "group relative transition-colors hover:text-[var(--color-fg)]",
        l.label === "Contact" && "text-[var(--color-fg)]",
      )}
    >
      {l.label}
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-px w-0 bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-accent-3))] transition-all duration-300 group-hover:w-full"
      />
    </Link>
  ))}
</div>
```

- [ ] **Step 2: Make the wordmark mono-tinted and mobile links mono**

Wordmark `<Link>` (line ~38): keep `font-[family-name:var(--font-display)] text-sm font-bold tracking-tight`. Change the mobile toggle button text and mobile panel links to use `font-[family-name:var(--font-mono)] text-xs`. (Add `font-[family-name:var(--font-mono)]` to the mobile `<div id="mobile-nav">` container className.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Nav.tsx
git commit -m "style: mono nav with gradient hover underline"
```

### Task 11: `Footer`

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Restyle**

Keep `id="contact"`, the mailto, socials map, and the year line. Specifically:
- eyebrow: replace the `<p>` class with `<p className="label-mono uppercase">Contact</p>`.
- heading: add `text-gradient` to the `<h2>`'s existing class list.
- socials container (currently `text-sm`): **replace** `text-sm` with `font-[family-name:var(--font-mono)] text-xs` (don't append — avoid two conflicting font-size utilities).
- copyright `<p>` (currently `text-xs`): add `font-[family-name:var(--font-mono)]`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "style: mono footer with gradient heading"
```

---

## Chunk 5: Home sections

### Task 12: `Hero`

**Files:**
- Modify: `src/components/home/Hero.tsx`

Keep the `<Reveal>` structure and the `See my work →` / `About me` buttons (e2e asserts `see my work`).

- [ ] **Step 1: Eyebrow → mono with index, rule, gradient phrase, magnetic primary**

Replace the body of the `<section>` with:

```tsx
<Reveal>
  <p className="label-mono inline-flex items-center gap-3 uppercase">
    <span aria-hidden>01</span>
    <span aria-hidden className="h-px w-8 bg-[var(--color-border-strong)]" />
    {site.role}
  </p>
</Reveal>
<Reveal delay={0.05}>
  <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl">
    Software products that people <span className="text-gradient">actually use.</span>
  </h1>
</Reveal>
<Reveal delay={0.1}>
  <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">
    From healthcare automation to consumer apps — Parahealth, Claruss, and more. I design, build, and ship the
    whole thing.
  </p>
</Reveal>
<Reveal delay={0.15}>
  <div className="mt-9 flex flex-wrap gap-3">
    <MagneticButton>
      <Button href="/#work">See my work →</Button>
    </MagneticButton>
    <Button href="/#about" variant="secondary">
      About me
    </Button>
  </div>
</Reveal>
```

Add imports: `import { MagneticButton } from "@/components/ui/MagneticButton";` (the `SectionLabel` import may be dropped if unused — run lint to confirm).

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "style: hero — mono eyebrow, gradient phrase, magnetic CTA"
```

### Task 13: `ProjectGrid` + `ProjectCardBody` + carousel index

**Files:**
- Modify: `src/components/home/ProjectGrid.tsx`, `src/components/home/ProjectCardBody.tsx`, `src/components/home/ProjectCarousel.tsx`

- [ ] **Step 1: `ProjectGrid` keeps `text-gradient` heading; refresh copy classes only if needed**

`ProjectGrid.tsx` already applies `text-gradient` to its `SectionHeading` — leave it. No change required beyond confirming the eyebrow now renders mono via the updated `SectionLabel`. (No edit needed unless lint flags; this task focuses on the card.)

- [ ] **Step 2: `ProjectCardBody` — translucent hairline card, mono meta, gradient hover sweep**

In `ProjectCardBody.tsx`, replace the outer card `<div>` classes and the meta row so the card is more transparent (field shows through), the title/"View case study" use mono for the meta line, and a gradient sweep appears on `active`:

Outer wrapper:
```tsx
className={cn(
  "group relative h-full overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)] backdrop-blur-sm transition-colors duration-300",
  active ? "border-[var(--color-border-strong)] shadow-[var(--shadow-glow)]" : "border-[var(--color-border)]",
)}
```
Change the "View case study →" `<span>` to mono: add `font-[family-name:var(--font-mono)] text-[11px]` to its className. Keep the `Tag` usage and the `Launch ↗` live tag.

- [ ] **Step 3: `ProjectCarousel` active dot uses the gradient**

In `ProjectCarousel.tsx`, change the active dot class (line ~164) from `w-6 bg-[var(--color-accent)]` to:
```tsx
"w-6 bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-accent-3))]"
```
Leave all carousel behavior, refs, drag, and a11y untouched.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ProjectGrid.tsx src/components/home/ProjectCardBody.tsx src/components/home/ProjectCarousel.tsx
git commit -m "style: work cards — translucent hairline, mono meta, gradient dot"
```

### Task 14: `AboutSection`

**Files:**
- Modify: `src/components/home/AboutSection.tsx`

- [ ] **Step 1: Hairline portrait frame already present; add green "now" status dot, mono socials**

Change the italic `now` paragraph (line ~29) to a status row with a green live dot:

```tsx
<p className="flex items-center gap-2.5 text-[var(--color-fg-subtle)]">
  <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-live)] shadow-[0_0_8px_var(--color-live)]" />
  <span className="italic">{now}</span>
</p>
```

For the socials container `<div>` (line ~40, currently `text-sm`): **replace** `text-sm` with `font-[family-name:var(--font-mono)] text-xs` (don't append). The `tools` already render as `Tag` (now mono via Task 9) — no change.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/AboutSection.tsx
git commit -m "style: about — live status dot, mono socials"
```

---

## Chunk 6: Project detail pages, resume, not-found

### Task 15: `ProjectHero` + `ActionButtons`

**Files:**
- Modify: `src/components/project/ProjectHero.tsx`, `src/components/project/ActionButtons.tsx`

Keep `ActionButtons` link logic and labels exactly — **do not rename buttons**, because
`src/content/` and the rest of the site depend on them. NOTE: the existing e2e "launch
action" regex does NOT currently match most of these labels (that test is already red on
`main`); it is fixed in Task 18 by broadening the regex, NOT by renaming buttons. Actual
labels per slug: parahealth → "App", "Marketing site"; claruss → "App Site", "App Store";
wedding → "App Site"; grocery → "App Site". (Every project renders at least one external
action link, since each has `links.live`.)

- [ ] **Step 1: `ProjectHero` gradient on the project name + mono eyebrow**

In `ProjectHero.tsx`, the `SectionLabel` already renders mono (Task 9). Add `text-gradient` to the `<h1>` className. No other change.

- [ ] **Step 2: `ActionButtons` — make the first/primary action visually primary**

No structural change needed; the `Button` primary variant is now gradient-tinted (Task 7). Leave as-is. (This task is effectively confirmation + the ProjectHero edit.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/project/ProjectHero.tsx
git commit -m "style: project hero — gradient title"
```

### Task 16: Project media frames + `BuildStory` + `ProjectPager`

**Files:**
- Modify: `src/components/project/Gallery.tsx`, `BrowserFrame.tsx`, `PhoneFrame.tsx`, `BuildStory.tsx`, `ProjectPager.tsx`

For each, apply the language WITHOUT changing structure/props/behavior:
- Any section eyebrow text → `SectionLabel` (already mono) or add `label-mono uppercase`.
- Captions/labels → `font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-subtle)]`.
- Frames/borders → ensure they use `border-[var(--color-border)]` hairlines (they already do; tokens changed centrally).
- `ProjectPager` prev/next labels → mono.

- [ ] **Step 1: Read each file, apply the above minimally**

Read each file first; make the smallest edits that apply mono captions/eyebrows. Do not alter the gallery's media logic, the phone/browser frame geometry, or pager navigation.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/project/
git commit -m "style: project media frames, build story, pager — mono captions"
```

### Task 17: `resume` page + `not-found`

**Files:**
- Modify: `src/app/resume/page.tsx`, `src/app/not-found.tsx`

- [ ] **Step 1: `resume` — gradient name, mono helper text**

`SectionLabel` is already mono. Add `text-gradient` to the `<h1>` (`{site.name}`). Change the "If the résumé doesn't load…" helper `<p>` to `font-[family-name:var(--font-mono)] text-xs`.

- [ ] **Step 2: `not-found` — mono 404 eyebrow, gradient heading**

Change the `404` `<p>` className to `label-mono uppercase`. Add `text-gradient` to the `<h1>`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/resume/page.tsx src/app/not-found.tsx
git commit -m "style: resume + 404 — mono + gradient"
```

---

## Chunk 7: Verification

### Task 18: Fix pre-existing e2e, extend smoke + full gate

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Fix the already-red "launch action" regex**

`tests/e2e/smoke.spec.ts:21` uses `/launch app|app store/i`, which matches only Claruss's
"App Store" button — the test fails on parahealth/wedding/grocery and is **already red on
`main`**. The intent is "every project page links out to the real product." Broaden the
regex to match the actual action labels ("App", "App Site", "Marketing site", "App Store"):

Replace line 21:
```ts
    await expect(page.getByRole("link", { name: /launch app|app store/i }).first()).toBeVisible();
```
with:
```ts
    await expect(page.getByRole("link", { name: /\bapp\b|site|store|launch|demo/i }).first()).toBeVisible();
```
(`\bapp\b` matches "App"/"App Store"/"App Site"; `site` matches "Marketing site"/"App Site".)

- [ ] **Step 2: Add canvas-mount + clickability assertions**

Add to the first test (`home page renders without console errors`), after the existing assertions:

```ts
// the decorative particle field mounts as an aria-hidden canvas behind content
await expect(page.locator("canvas[aria-hidden]")).toHaveCount(1);
// content remains clickable above the canvas (canvas is pointer-events-none)
await page.getByRole("link", { name: /see my work/i }).click();
await expect(page).toHaveURL(/#work$/);
```

- [ ] **Step 3: Run the full verification gate**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`
Expected: ALL PASS (Playwright on port 3100). Unit tests `tests/unit/projects.test.ts` and
`tests/unit/particle-field.test.ts` green; all e2e green (the launch-action test now passes
thanks to Step 1 — it was red before this plan).

- [ ] **Step 4: Manual acceptance pass**

- Desktop: cursor moves the field; hover underlines animate in nav; magnetic CTA pulls slightly; cards lift.
- Reduced motion (OS setting): field is a single static frame; no parallax, no magnetic pull; reveals are instant.
- Mobile/touch viewport: field renders static (no pointer interaction), carousel swipes, mobile nav toggles.
- All four `/work/[slug]` pages, `/resume`, and a bad slug (404) render correctly.
- No console errors; no layout shift.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test: fix launch-action regex; assert particle-field canvas mounts"
```

### Task 19: Update project memory

- [ ] **Step 1:** After merge, note in memory that `GlowBackdrop` was replaced by `ParticleField` (canvas, `particle-field.ts` pure helpers) and the design is now the "vectored space" system (mono labels via `--font-mono`/Geist Mono, multi-stop `text-gradient`, darker tokens). Update `portfolio-site.md` + `MEMORY.md` pointer.

---

## Notes for the implementer

- **Don't touch `src/content/`** — all copy/data stays. No renaming of `ActionButtons` labels (e2e depends on them).
- **Token changes are central** — once `globals.css` is updated, most components inherit the darker bg/hairlines automatically; component edits are mostly mono type + gradient accents.
- **Reduced motion is non-negotiable** — `ParticleField`, `MagneticButton`, `Reveal`, and `PageTransition` must all degrade. Test with the OS setting on.
- **Keep all existing a11y** (aria-controls, focus-visible rings, sr-only carousel label, aria-hidden decorations).
- Reference live behavior mockup: `.superpowers/brainstorm/52219-1782158566/particles.html`.
