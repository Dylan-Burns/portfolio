# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Dylan Burns's personal portfolio site — a dark-cinematic landing page plus a detail page per project (Parahealth, Claruss, Wedding site, Grocery tracker), each linking out to the live app — deployed on Vercel.

**Architecture:** Next.js (App Router, TypeScript) statically rendered throughout. Content lives in a typed TS data module (`src/content/`); pages map over it. Tailwind CSS v4 for styling with a dark-cinematic token layer; Framer Motion (the `motion` package) for entrance reveals, hover effects, and route transitions, all gated behind `prefers-reduced-motion`. No backend, no database, no auth. Verification leans on `tsc --noEmit` + `next build`, a Vitest test that validates the project data, and a Playwright smoke test.

**Tech Stack:** Next.js (latest, App Router) · TypeScript · Tailwind CSS v4 · `motion` (Framer Motion) · `clsx` + `tailwind-merge` · Vitest · Playwright · `next/font`, `next/image`, `next/og` · deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-05-12-portfolio-site-design.md` — read it before starting.

**Skills to use during implementation:**
- `frontend-design:frontend-design` — for every visual component/page. The TSX in this plan is a working starting point; apply real design polish (spacing, type scale, motion timing, responsive behavior) within the contracts each task defines.
- `superpowers:test-driven-development` — for the content-layer task (Task 6): write the data test first, watch it fail, then add the data.
- `vercel:deployments-cicd` / `vercel:deploy` — for the final deploy task.

**Conventions:**
- Path alias `@/*` → `src/*`.
- Every external link: `target="_blank" rel="noopener noreferrer"` and a visible `↗`.
- All client components that animate must check `useReducedMotion()` (from `motion/react`) and degrade gracefully.
- Commit after every task with a conventional-commit message (`feat:`, `chore:`, `test:`, `style:`).
- Run `npx tsc --noEmit` before each commit in tasks that touch `.ts`/`.tsx`; it must pass.

---

## Chunk 1: Scaffold, tooling, and theme foundation

### Task 1: Scaffold the Next.js app into the existing repo

**Files:**
- Create (via generator): `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `next-env.d.ts`, etc.
- Modify: `.gitignore` (re-add `.superpowers/` after the generator overwrites it)

The repo already contains `.git/`, `.gitignore`, `docs/`, and a `.superpowers/` scratch dir. Rather than risk `create-next-app` balking at a non-empty directory, scaffold into a sibling temp directory and copy the result in.

- [ ] **Step 1: Generate into a temp directory**

Run from the parent of the repo (`/Users/dylanburns/Documents/GitHub`); if a stale `portfolio-scaffold-tmp/` exists, `rm -rf` it first:
```bash
npx create-next-app@latest portfolio-scaffold-tmp \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --yes
```
Expected: a new `portfolio-scaffold-tmp/` directory with a Next.js 15/16 app, Tailwind v4, ESLint flat config.

- [ ] **Step 2: Copy generated files into the repo (excluding its git + node_modules)**

```bash
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' \
  portfolio-scaffold-tmp/ portfolio/
rm -rf portfolio-scaffold-tmp
```
Then from inside `portfolio/`:
```bash
npm install
```

- [ ] **Step 3: Re-add `.superpowers/` to `.gitignore`**

The generator's `.gitignore` already covers `node_modules`, `.next`, `.env*`, `.vercel`, `.DS_Store`. Append our line if missing:
```
# brainstorming visual companion
.superpowers/
```

- [ ] **Step 4: Strip the default boilerplate and configure SVG images**

- Replace `src/app/page.tsx` with a minimal placeholder: `export default function Home() { return <main>Portfolio — coming together.</main>; }`
- Remove the demo CSS from `src/app/globals.css` down to just `@import "tailwindcss";` (we rewrite it in Task 3).
- Delete any unused SVGs `create-next-app` dropped in `public/` (e.g. `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).
- In `src/app/layout.tsx`, keep it minimal for now (we flesh it out in Task 9): a root `<html lang="en">` / `<body>` with a `metadata` export of `{ title: "Dylan Burns", description: "..." }`.
- **Edit `next.config.ts`** to let the Image Optimizer serve SVG (the placeholder media in Task 5 are SVG; `next/image` returns HTTP 400 for SVG otherwise):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verify it builds and runs**

Run:
```bash
npx tsc --noEmit
npm run build
```
Expected: type-check passes; build succeeds with one route (`/`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app (App Router, TS, Tailwind v4)"
```

---

### Task 2: Add libraries, the `cn` helper, Vitest, and Playwright

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `src/lib/cn.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Verify (no change expected): `tsconfig.json` already has the `@/*` path alias and an `include` of `**/*.ts`/`**/*.tsx` (so `tests/**` is type-checked by `tsc --noEmit`). If `include` is narrower than that, add `"tests/**/*.ts"` to it.

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
npm install motion clsx tailwind-merge
npm install -D vitest @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Add scripts to `package.json`**

Merge into `"scripts"`:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 3: Create `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 5: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 6: Sanity-check Vitest runs (no tests yet is fine)**

Run: `npm test`
Expected: Vitest reports "No test files found" (exit 0) — acceptable; we add the test in Task 6.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add motion, cn helper, Vitest and Playwright config"
```

---

### Task 3: Dark-cinematic theme + global styles + fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (wire `next/font`)

- [ ] **Step 1: Pick and wire fonts via `next/font`**

In `src/app/layout.tsx`, import a grotesk/geometric sans for body and a tighter cut for display. Use Google fonts available in `next/font/google` — body: `Geist`; display: `Space_Grotesk`. **Important:** give `next/font` its own CSS-variable names (`--font-geist-sans`, `--font-space-grotesk`); the `@theme` block in Step 2 then composes the public `--font-sans` / `--font-display` tokens from those. (Naming the `next/font` variables `--font-sans` directly would make the `@theme` declaration `--font-sans: var(--font-sans), …` self-referential and invalid.)

```tsx
import { Geist, Space_Grotesk } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", weight: ["500", "600", "700"] });
```
Add `className={`${geistSans.variable} ${spaceGrotesk.variable}`}` to `<html>`.

- [ ] **Step 2: Write `src/app/globals.css` — theme tokens**

Replace the file with:

```css
@import "tailwindcss";

@theme {
  /* surfaces */
  --color-bg: #07070d;
  --color-bg-2: #0c0d1a;
  --color-surface: rgba(255, 255, 255, 0.045);
  --color-surface-hover: rgba(255, 255, 255, 0.07);
  --color-border: rgba(255, 255, 255, 0.09);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  /* text */
  --color-fg: #e7e9f5;
  --color-fg-muted: #a3a8cd;
  --color-fg-subtle: #7e85bd;

  /* accents */
  --color-accent: #8b93ff;       /* indigo-ish */
  --color-accent-2: #22d3ee;     /* cyan */
  --color-accent-3: #c084fc;     /* violet */
  --color-live: #3ddc97;         /* "live" green for launch affordances */

  /* type — composed from the next/font variables wired in layout.tsx (Step 1) */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;

  /* radii / shadow */
  --radius-card: 14px;
  --radius-button: 9px;
  --shadow-glow: 0 30px 90px rgba(0, 0, 0, 0.55);
}

@layer base {
  html { color-scheme: dark; scroll-behavior: smooth; }
  body {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  ::selection { background: color-mix(in oklab, var(--color-accent) 35%, transparent); }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  }
}

/* utility: gradient text */
@utility text-gradient {
  background: linear-gradient(180deg, #ffffff, color-mix(in oklab, var(--color-fg) 70%, var(--color-accent)));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

(If the installed Tailwind version doesn't support `@utility`, define `.text-gradient` in an `@layer utilities { ... }` block instead — functionally equivalent.)

- [ ] **Step 3: Verify**

Run `npm run dev`, open `http://localhost:3000` — page should render on the near-black `--color-bg` with light text in the chosen font. Then `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: dark-cinematic theme tokens, global styles, fonts"
```

---

## Chunk 2: Content layer (data model + data, test-first)

### Task 4: Project & site types

**Files:**
- Create: `src/content/projects.types.ts`

- [ ] **Step 1: Define the types**

```ts
export type ProjectCategory =
  | "Healthcare · AI"
  | "iOS · Consumer"
  | "Web · Personal"
  | "Web · Side project";

export interface ProjectLinks {
  /** Primary "Launch app" target. */
  live?: string;
  /** iOS App Store URL. */
  appStore?: string;
  /** Public source repository, if any. */
  source?: string;
  /** Optional interactive/sandbox demo (e.g. Parahealth, added later). */
  demo?: string;
}

export interface ProjectImage {
  src: string;       // path under /public
  alt: string;       // non-empty
  width: number;     // > 0
  height: number;    // > 0
}

export interface ProjectVideo {
  src: string;       // path under /public (mp4/webm)
  poster?: string;   // path under /public
}

export interface Project {
  slug: string;                  // unique, url-safe
  name: string;
  tagline: string;               // one line — used on the card
  summary: string;               // 1–3 sentences — used in the detail hero
  category: ProjectCategory;
  role: string;                  // e.g. "Founder", "Builder"
  period: string;                // e.g. "2024 – now"
  /** How gallery images are framed on the detail page. */
  frame: "browser" | "phone";
  links: ProjectLinks;
  cover: ProjectImage;           // card + detail hero background
  screenshots: ProjectImage[];   // gallery (>= 1)
  video?: ProjectVideo;          // optional looping muted clip
  problem: string[];             // paragraphs, plain text
  whatIBuilt: string[];          // paragraphs, plain text
  stack: string[];               // tech chips (>= 1)
  outcomes: string[];            // bullets (>= 1)
}

export interface SiteConfig {
  name: string;
  role: string;                  // short role line, e.g. "Builder & Founder"
  url: string;                   // canonical site URL
  email: string;
  resumePath: string;            // path under /public, e.g. "/dylan-burns-resume.pdf"
  socials: { label: string; href: string }[];
  /** About-section content. */
  about: { portrait: ProjectImage; bio: string[]; tools: string[]; now: string };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes (no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add src/content/projects.types.ts
git commit -m "feat: content layer types (Project, SiteConfig)"
```

---

### Task 5: Placeholder media assets

**Files:**
- Create: `public/projects/parahealth/cover.svg`, `public/projects/parahealth/shot-1.svg`, `public/projects/parahealth/shot-2.svg`
- Create: `public/projects/claruss/cover.svg`, `public/projects/claruss/shot-1.svg`, `public/projects/claruss/shot-2.svg`
- Create: `public/projects/wedding/cover.svg`, `public/projects/wedding/shot-1.svg`
- Create: `public/projects/grocery/cover.svg`, `public/projects/grocery/shot-1.svg`
- Create: `public/about/portrait.svg`
- Create: `public/dylan-burns-resume.pdf` (placeholder)

These are clearly-marked placeholders the owner replaces later (spec §9).

- [ ] **Step 1: Create simple labeled SVG placeholders**

Each SVG: a 1600×1000 (cover) / 1600×1000 (shot) / 1200×1500 (portrait) viewBox, dark gradient fill, and centered text saying e.g. `Parahealth — cover (placeholder)`. Example template (vary text, size, gradient hue per file):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1a1c3d"/><stop offset="1" stop-color="#07070d"/>
  </linearGradient></defs>
  <rect width="1600" height="1000" fill="url(#g)"/>
  <text x="800" y="500" fill="#9aa0c8" font-family="sans-serif" font-size="48" text-anchor="middle">Parahealth — cover (placeholder)</text>
</svg>
```

For phone-framed projects (Claruss), make shots a tall `1170×2532`-ish viewBox. Keep each SVG's `viewBox` aspect ratio consistent with the `width`/`height` declared for that image in `projects.ts` (Task 6), so `next/image` doesn't stretch the placeholder.

- [ ] **Step 2: Create the placeholder résumé PDF**

A 1-page PDF with the text "Dylan Burns — résumé (placeholder; replace before launch)". Generate however convenient (e.g. `printf` a minimal PDF, or a tiny script). It just needs to be a valid PDF at `public/dylan-burns-resume.pdf`.

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "chore: placeholder media assets (project shots, portrait, resume)"
```

---

### Task 6: Site config + project data, validated by a test (TDD)

Use the `superpowers:test-driven-development` skill: write the failing test first.

**Files:**
- Create: `tests/unit/projects.test.ts`
- Create: `src/content/site.ts`
- Create: `src/content/projects.ts`

- [ ] **Step 1: Write the failing data-validation test**

`tests/unit/projects.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

const PUBLIC = join(process.cwd(), "public");
const isAbsoluteUrl = (s: string) => { try { new URL(s); return true; } catch { return false; } };
const publicFileExists = (p: string) => existsSync(join(PUBLIC, p.replace(/^\//, "")));

describe("project data", () => {
  it("has at least the four expected projects", () => {
    const slugs = projects.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["parahealth", "claruss", "wedding", "grocery"]));
  });

  it("has unique slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every project has required non-empty fields", () => {
    for (const p of projects) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.trim()).not.toBe("");
      expect(p.tagline.trim()).not.toBe("");
      expect(p.summary.trim()).not.toBe("");
      expect(p.role.trim()).not.toBe("");
      expect(p.period.trim()).not.toBe("");
      expect(["browser", "phone"]).toContain(p.frame);
      expect(p.stack.length).toBeGreaterThan(0);
      expect(p.outcomes.length).toBeGreaterThan(0);
      expect(p.problem.length).toBeGreaterThan(0);
      expect(p.whatIBuilt.length).toBeGreaterThan(0);
      expect(p.screenshots.length).toBeGreaterThan(0);
    }
  });

  it("every link is an absolute URL", () => {
    for (const p of projects) {
      for (const v of Object.values(p.links)) {
        if (v) expect(isAbsoluteUrl(v), `${p.slug}: ${v}`).toBe(true);
      }
    }
  });

  it("every image has alt text, positive dimensions, and an existing file", () => {
    const imgs = projects.flatMap((p) => [p.cover, ...p.screenshots]);
    imgs.push(site.about.portrait);
    for (const img of imgs) {
      expect(img.alt.trim(), JSON.stringify(img)).not.toBe("");
      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
      expect(publicFileExists(img.src), `missing file: ${img.src}`).toBe(true);
    }
  });

  it("video sources (when present) point at existing files", () => {
    for (const p of projects) {
      if (p.video) {
        expect(publicFileExists(p.video.src), `missing video: ${p.video.src}`).toBe(true);
        if (p.video.poster) expect(publicFileExists(p.video.poster)).toBe(true);
      }
    }
  });
});

describe("site config", () => {
  it("has a valid url, an email, an existing resume, and at least one social", () => {
    expect(isAbsoluteUrl(site.url)).toBe(true);
    expect(site.email).toMatch(/.+@.+\..+/);
    expect(publicFileExists(site.resumePath), `missing resume: ${site.resumePath}`).toBe(true);
    expect(site.socials.length).toBeGreaterThan(0);
    for (const s of site.socials) expect(isAbsoluteUrl(s.href)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `@/content/projects` / `@/content/site`.

- [ ] **Step 3: Write `src/content/site.ts`**

```ts
import type { SiteConfig } from "./projects.types";

export const site: SiteConfig = {
  name: "Dylan Burns",
  role: "Builder & Founder",
  // TODO(owner): swap to the real domain once chosen (e.g. https://dylanburns.dev)
  url: "https://dylanburns.dev",
  email: "dylanburns1524@gmail.com",
  resumePath: "/dylan-burns-resume.pdf",
  socials: [
    { label: "GitHub", href: "https://github.com/Dylan-Burns" },
    // TODO(owner): add LinkedIn / X if wanted
  ],
  about: {
    portrait: { src: "/about/portrait.svg", alt: "Portrait of Dylan Burns", width: 1200, height: 1500 },
    bio: [
      // TODO(owner): real bio
      "I build software products end to end — design, engineering, and the unglamorous bits in between.",
      "Lately that's healthcare automation (Parahealth) and consumer apps (Claruss), with the occasional weekend project.",
    ],
    tools: ["TypeScript", "React / Next.js", "Node", "Swift / SwiftUI", "Postgres", "AI / LLMs", "Vercel"],
    now: "Currently building Parahealth — turning prior authorization from a multi-day slog into minutes.",
  },
};
```

- [ ] **Step 4: Write `src/content/projects.ts`**

Provide all four projects. Copy is placeholder-but-plausible; the owner refines it. Image paths must match the files created in Task 5.

```ts
import type { Project } from "./projects.types";

export const projects: Project[] = [
  {
    slug: "parahealth",
    name: "Parahealth",
    tagline: "Prior-authorization automation that turns a multi-day slog into minutes.",
    summary:
      "Prior authorization eats roughly 13 hours a week per clinician. Parahealth automates the gather → submit → follow-up loop end to end — AI reads the chart, fills the payer form, and chases the status.",
    category: "Healthcare · AI",
    role: "Founder",
    period: "2024 – now",
    frame: "browser",
    links: {
      live: "https://parahealth.ai",
      // TODO(owner): point `demo` at https://demo.parahealth.app once the synthetic-data sandbox exists
    },
    cover: { src: "/projects/parahealth/cover.svg", alt: "Parahealth dashboard", width: 1600, height: 1000 },
    screenshots: [
      { src: "/projects/parahealth/shot-1.svg", alt: "Parahealth — authorization queue", width: 1600, height: 1000 },
      { src: "/projects/parahealth/shot-2.svg", alt: "Parahealth — auto-filled payer form", width: 1600, height: 1000 },
    ],
    problem: [
      "Prior authorization is one of the biggest sources of administrative burden in US healthcare: clinics chase faxes, sit on hold with payers, and re-key the same clinical data into a dozen different portals.",
      "It delays care, burns out staff, and is almost entirely undifferentiated work — exactly the kind of thing software should eat.",
    ],
    whatIBuilt: [
      "An end-to-end platform: it ingests the relevant chart context, determines payer-specific requirements, drafts and submits the authorization, and then monitors and follows up on status automatically.",
      "Built the product from zero — data model, the AI pipeline that reads charts and fills forms, the reviewer UI, and the integrations.",
    ],
    stack: ["TypeScript", "Next.js", "Node", "Postgres", "LLM pipelines", "Vercel"],
    outcomes: [
      "Collapses a multi-day, multi-touch workflow into minutes of human review.",
      "In active use; founder-led.",
    ],
  },
  {
    slug: "claruss",
    name: "Claruss",
    tagline: "A screen-time app that actually helps you change behavior — live on the App Store.",
    summary:
      "Most screen-time tools just show you a depressing chart. Claruss is built around intention and gentle friction — it helps you set goals you'll actually keep and notice the moments that matter.",
    category: "iOS · Consumer",
    role: "Founder",
    period: "2023 – now",
    frame: "phone",
    links: {
      // TODO(owner): confirm primary target — claruss.app vs the direct App Store URL
      live: "https://claruss.app",
      appStore: "https://apps.apple.com/app/claruss",
    },
    cover: { src: "/projects/claruss/cover.svg", alt: "Claruss app", width: 1600, height: 1000 },
    screenshots: [
      { src: "/projects/claruss/shot-1.svg", alt: "Claruss — daily screen-time goal", width: 1170, height: 2532 },
      { src: "/projects/claruss/shot-2.svg", alt: "Claruss — focus session", width: 1170, height: 2532 },
    ],
    problem: [
      "Screen-time dashboards are guilt machines: lots of data, no behavior change. People want to use their phones more deliberately, not just feel bad about a number.",
    ],
    whatIBuilt: [
      "A native iOS app designed around intention-setting and lightweight friction at the right moments, with a clean, calm interface. Shipped it to the App Store and iterated from real usage.",
    ],
    stack: ["Swift", "SwiftUI", "Screen Time API", "iOS"],
    outcomes: [
      "Launched and available on the iOS App Store.",
      "Designed, built, and shipped solo.",
    ],
  },
  {
    slug: "wedding",
    name: "Wedding site",
    tagline: "A small, lovingly-built site for the big day — schedule, details, RSVP.",
    summary:
      "A personal one-pager for our wedding: the story, the schedule, travel details, and an RSVP flow — built quickly but carefully.",
    category: "Web · Personal",
    role: "Builder",
    period: "2024",
    frame: "browser",
    links: { live: "https://wedding-ecru-mu.vercel.app/" },
    cover: { src: "/projects/wedding/cover.svg", alt: "Wedding website", width: 1600, height: 1000 },
    screenshots: [
      { src: "/projects/wedding/shot-1.svg", alt: "Wedding website — landing", width: 1600, height: 1000 },
    ],
    problem: [
      "We wanted something nicer and more personal than the cookie-cutter wedding-site templates, without spending weeks on it.",
    ],
    whatIBuilt: [
      "A fast, responsive single-page site with the essentials — story, schedule, travel, and RSVP — deployed on Vercel.",
    ],
    stack: ["Next.js", "React", "Vercel"],
    outcomes: ["Used by guests for the actual event.", "Built in a weekend."],
  },
  {
    slug: "grocery",
    name: "Grocery tracker",
    tagline: "Know what's in the fridge, what's running low, and what to buy — without the bloat.",
    summary:
      "A focused web app for tracking pantry inventory and building a smart shopping list, without the feature creep of most household apps.",
    category: "Web · Side project",
    role: "Builder",
    period: "2024",
    frame: "browser",
    links: {
      // TODO(owner): provide the live URL for the grocery tracker
      live: "https://example.com/grocery-placeholder",
    },
    cover: { src: "/projects/grocery/cover.svg", alt: "Grocery tracker app", width: 1600, height: 1000 },
    screenshots: [
      { src: "/projects/grocery/shot-1.svg", alt: "Grocery tracker — shopping list", width: 1600, height: 1000 },
    ],
    problem: [
      "Household-inventory apps tend to be either bare spreadsheets or bloated organizers nobody keeps up with.",
    ],
    whatIBuilt: [
      "A lightweight web app: track what you have, flag what's low, and generate a shopping list — fast enough to actually use.",
    ],
    stack: ["Next.js", "React", "Vercel"],
    outcomes: ["Used for our own groceries.", "Deliberately scoped small."],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function adjacentProjects(slug: string): { prev: Project; next: Project } | undefined {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return undefined;
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}
```

> Note: the grocery `links.live` placeholder still satisfies the "absolute URL" test. Replace with the real URL when the owner provides it; until then, the project page's "Launch app" button will point at the placeholder — acceptable per spec §9.

- [ ] **Step 5: Run the test — verify it passes**

Run: `npm test`
Expected: all tests PASS. Also run `npx tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/projects.test.ts src/content/site.ts src/content/projects.ts
git commit -m "feat: site config + project data with validation test"
```

---

## Chunk 3: Shared UI primitives, motion helpers, layout chrome

### Task 7: UI primitives — Button, Tag, Section headings

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Tag.tsx`
- Create: `src/components/ui/Section.tsx`

Use `frontend-design:frontend-design` for the visual polish; the code below is the contract + a working baseline.

- [ ] **Step 1: `src/components/ui/Button.tsx`**

A polymorphic button/link. Variants: `primary` (white on dark), `secondary` (translucent surface + border), `ghost`. Always renders an `↗` after the label when `external` is true and opens in a new tab safely.

```tsx
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
const base =
  "inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const variants: Record<Variant, string> = {
  primary: "bg-white text-[var(--color-bg)] hover:bg-white/90",
  secondary: "bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]",
  ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
};

export function Button({
  children, variant = "primary", external = false, className, ...rest
}: { children: ReactNode; variant?: Variant; external?: boolean } & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variants[variant], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {external && <span aria-hidden>↗</span>}
    </Link>
  );
}
```

- [ ] **Step 2: `src/components/ui/Tag.tsx`**

```tsx
import { cn } from "@/lib/cn";

export function Tag({ children, tone = "default", className }: {
  children: React.ReactNode;
  tone?: "default" | "live";
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
      tone === "live"
        ? "border-[color-mix(in_oklab,var(--color-live)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-live)_12%,transparent)] text-[var(--color-live)]"
        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)]",
      className,
    )}>
      {children}
    </span>
  );
}
```

- [ ] **Step 3: `src/components/ui/Section.tsx`** — `SectionLabel` (small uppercase kicker) and `SectionHeading` (display-font heading), plus a `Section` wrapper that applies consistent vertical rhythm and an `id` for anchor links.

```tsx
import { cn } from "@/lib/cn";

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]", className)}>{children}</p>;
}

export function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl", className)}>{children}</h2>;
}

export function Section({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  return <section id={id} className={cn("mx-auto w-full max-w-5xl px-6 py-20 md:py-28 scroll-mt-24", className)}>{children}</section>;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` — passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui
git commit -m "feat: UI primitives (Button, Tag, Section headings)"
```

---

### Task 8: Motion helpers — config, Reveal, PageTransition

**Files:**
- Create: `src/components/motion/motion-config.ts`
- Create: `src/components/motion/Reveal.tsx`
- Create: `src/components/motion/PageTransition.tsx`

- [ ] **Step 1: `src/components/motion/motion-config.ts`**

```ts
// A cubic-bezier ease-out. Not `as const` — Framer Motion's `ease` field wants a mutable
// `[number, number, number, number]`, and a readonly tuple isn't assignable to it under `tsc`.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
```

- [ ] **Step 2: `src/components/motion/Reveal.tsx`** — a client component that wraps children in a `motion` element, plays the `reveal` variant once on scroll-into-view, and renders children plainly (no animation) when `useReducedMotion()` is true. Accepts an optional `as` tag and `delay`.

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { reveal } from "./motion-config";

export function Reveal({ children, as = "div", delay = 0, className }: {
  children: ReactNode; as?: ElementType; delay?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as as keyof typeof motion] as typeof motion.div;
  if (reduce) {
    const Plain = as as ElementType;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </Comp>
  );
}
```

- [ ] **Step 3: `src/components/motion/PageTransition.tsx`** — a client component that wraps `{children}` in a `motion.div` keyed on `usePathname()`, doing a subtle fade/translate on route change; renders children plainly under reduced motion. Used in `layout.tsx` around `{children}`.

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EASE_OUT } from "./motion-config";

export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` — passes. (If `motion[as]` indexing complains, narrow `as` to a small union like `"div" | "section" | "ul" | "li"` — adjust callers accordingly.)

- [ ] **Step 5: Commit**

```bash
git add src/components/motion
git commit -m "feat: motion helpers (config, Reveal, PageTransition)"
```

---

### Task 9: Layout chrome — Nav, Footer, root layout, GlowBackdrop

**Files:**
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/visuals/GlowBackdrop.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: `src/components/visuals/GlowBackdrop.tsx`** — fixed, `aria-hidden`, `pointer-events-none` layer with one or two large blurred conic/radial gradient blobs in the accent colors, low opacity. A `variant` prop nudges position/hue ("hero" vs "page"). Pure CSS — no JS animation needed (the global reduced-motion rule already neutralizes any CSS animation if added later).

```tsx
import { cn } from "@/lib/cn";

export function GlowBackdrop({ variant = "page" }: { variant?: "hero" | "page" }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={cn(
        "absolute h-[40rem] w-[40rem] rounded-full opacity-40 blur-[120px]",
        variant === "hero" ? "-right-40 -top-56" : "-left-56 -top-72",
      )} style={{ background: "conic-gradient(from 120deg, var(--color-accent), var(--color-accent-2), var(--color-accent-3), var(--color-accent))" }} />
      <div className="absolute bottom-[-20rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--color-accent-3), transparent 70%)" }} />
    </div>
  );
}
```

- [ ] **Step 2: `src/components/layout/Nav.tsx`** — `"use client"`. Sticky top bar. Transparent initially; once `window.scrollY > 8` add a translucent blurred background + bottom border (track with a scroll listener + state, or `IntersectionObserver` on a sentinel). Left: name → links to `/`. Right: `Work` (→ `/#work`), `About` (→ `/#about`), `Resume ↓` (→ `site.resumePath`, `download`), `Contact` (→ `/#contact`, the Footer section rendered by the layout). On `< md`, collapse the right side into a button that toggles a small panel. Use `site` from `@/content/site`.

```tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";

const links = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Resume ↓", href: site.resumePath, download: true as const },
  { label: "Contact", href: "/#contact" }, // anchors to the Footer's id="contact" (rendered by the layout on every page)
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={cn(
      "sticky top-0 z-50 transition-colors",
      scrolled && "border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_72%,transparent)] backdrop-blur-md",
    )}>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight">{site.name}</Link>
        <button className="md:hidden text-sm text-[var(--color-fg-muted)]" aria-expanded={open} onClick={() => setOpen((v) => !v)}>Menu</button>
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--color-fg-muted)]">
          {links.map((l) => (
            <Link key={l.label} href={l.href} {...("download" in l ? { download: true } : {})}
              className={cn("transition-colors hover:text-[var(--color-fg)]", l.label === "Contact" && "rounded-md bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]")}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-2)] px-6 py-4 flex flex-col gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.label} href={l.href} {...("download" in l ? { download: true } : {})} onClick={() => setOpen(false)} className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: `src/components/layout/Footer.tsx`** — also serves as the `#contact` section. Big display heading ("Let's build something." or similar), the email as a prominent `mailto:` link, the social links from `site.socials` (each external), and a copyright line with the current year. Server component (no client state needed).

```tsx
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-[var(--color-border)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">Contact</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-5xl">Let&apos;s build something.</h2>
        <a href={`mailto:${site.email}`} className="mt-6 inline-block text-lg text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline">{site.email}</a>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-fg-muted)]">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-fg)]">{s.label} ↗</a>
          ))}
        </div>
        <p className="mt-12 text-xs text-[var(--color-fg-subtle)]">© {new Date().getFullYear()} {site.name}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update `src/app/layout.tsx`**

Wire fonts (Task 3), `<Nav/>`, `<PageTransition>{children}</PageTransition>`, `<Footer/>`, and a `<GlowBackdrop/>` at the page level. Set base `metadata` (title template `"%s · Dylan Burns"`, default title `"Dylan Burns — Builder & Founder"`, description, `metadataBase: new URL(site.url)`, `openGraph`, `twitter`). Structure:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Space_Grotesk } from "next/font/google";
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { GlowBackdrop } from "@/components/visuals/GlowBackdrop";
import { PageTransition } from "@/components/motion/PageTransition";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
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
    <html lang="en" className={`${geistSans.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <GlowBackdrop />
        <Nav />
        <PageTransition>{children}</PageTransition>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify**

`npm run dev` → the sticky nav, glow backdrop, and footer appear on `/`; scrolling adds the blurred nav background; the mobile menu toggles. Then `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout src/components/visuals src/app/layout.tsx
git commit -m "feat: layout chrome (Nav, Footer, GlowBackdrop, root layout)"
```

---

## Chunk 4: Home page

### Task 10: Hero

**Files:**
- Create: `src/components/home/Hero.tsx`

- [ ] **Step 1: Build the Hero**

Full-height-ish first screen. `SectionLabel` ("Builder & Founder" from `site.role`), a large display headline using the `text-gradient` utility (e.g. "Software products that people actually use."), a muted supporting paragraph, and two CTAs via `Button`: primary `See my work →` (→ `/#work`), secondary `About me` (→ `/#about`). Wrap the headline/sub/CTAs in `Reveal`s with small staggered `delay`s. `Hero` stays a server component that renders `Reveal` (client) children. Don't add another `GlowBackdrop` here — the layout already renders the global one; just give the hero generous top/bottom padding (`pt-28 md:pt-40 pb-24`).

```tsx
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-28 pb-24 md:pt-40 md:pb-28">
      <Reveal><SectionLabel>{site.role}</SectionLabel></Reveal>
      <Reveal delay={0.05}>
        <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl text-gradient">
          Software products that people actually use.
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">
          From healthcare automation to consumer apps — Parahealth, Claruss, and more.
          I design, build, and ship the whole thing.
        </p>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="/#work">See my work →</Button>
          <Button href="/#about" variant="secondary">About me</Button>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify & commit**

`npm run dev` to eyeball; `npx tsc --noEmit`.
```bash
git add src/components/home/Hero.tsx
git commit -m "feat: home hero section"
```

---

### Task 11: ProjectCard + ProjectGrid

**Files:**
- Create: `src/components/home/ProjectCard.tsx`
- Create: `src/components/home/ProjectGrid.tsx`

- [ ] **Step 1: `src/components/home/ProjectCard.tsx`**

A card linking to `/work/[slug]`. Top: `next/image` of `project.cover` (`fill`, `object-cover`, fixed-aspect container, `sizes="(max-width: 768px) 100vw, 50vw"`). Body: project name, a category `Tag`, the `tagline`, and a small row — a "live" `Tag` reading "Launch ↗" when `links.live` exists, plus `View case study →`. Hover: lift (`-translate-y-1`) + stronger border/shadow (use `group` + transitions). The whole card is one `<Link>`.

```tsx
import Image from "next/image";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/content/projects.types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/work/${project.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-glow)]">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--color-border)]">
        <Image src={project.cover.src} alt={project.cover.alt} fill sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{project.name}</h3>
          <Tag>{project.category}</Tag>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{project.tagline}</p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          {project.links.live && <Tag tone="live">Launch ↗</Tag>}
          <span className="text-[var(--color-fg-subtle)] transition-colors group-hover:text-[var(--color-fg)]">View case study →</span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: `src/components/home/ProjectGrid.tsx`**

Wraps the cards in a `Section id="work"` with a `SectionLabel` ("Selected work") and `SectionHeading` ("Four products, end to end."), then a responsive 2-col grid (`grid gap-5 md:grid-cols-2`). Each card wrapped in a `Reveal` with a stagger `delay` based on index (`index * 0.06`). Maps over `projects` from `@/content/projects`.

```tsx
import { projects } from "@/content/projects";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "./ProjectCard";

export function ProjectGrid() {
  return (
    <Section id="work">
      <SectionLabel>Selected work</SectionLabel>
      <SectionHeading className="mt-3 text-gradient">Four products, end to end.</SectionHeading>
      <p className="mt-4 max-w-xl text-[var(--color-fg-muted)]">Each one shipped — designed, built, and deployed. Click in for the story, then go use the real thing.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.06}><ProjectCard project={p} /></Reveal>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Verify & commit**

`npx tsc --noEmit`; eyeball in dev.
```bash
git add src/components/home/ProjectCard.tsx src/components/home/ProjectGrid.tsx
git commit -m "feat: project card + grid"
```

---

### Task 12: AboutSection + assemble the home page

**Files:**
- Create: `src/components/home/AboutSection.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `src/components/home/AboutSection.tsx`**

`Section id="about"`. Two-column on `md+` (stack on mobile): left = `next/image` portrait (`site.about.portrait`, rounded, bordered, fixed aspect); right = `SectionLabel` ("About"), `SectionHeading` ("Hi, I'm Dylan."), the `bio` paragraphs, a `now` line styled distinctly (e.g. small pill or italic muted), and a wrap of tool `Tag`s from `site.about.tools`. Wrap blocks in `Reveal`.

```tsx
import Image from "next/image";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function AboutSection() {
  const { portrait, bio, tools, now } = site.about;
  return (
    <Section id="about" className="grid items-start gap-12 md:grid-cols-[280px_1fr]">
      <Reveal>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <Image src={portrait.src} alt={portrait.alt} fill sizes="280px" className="object-cover" />
        </div>
      </Reveal>
      <div>
        <Reveal><SectionLabel>About</SectionLabel></Reveal>
        <Reveal delay={0.05}><SectionHeading className="mt-3">Hi, I&apos;m Dylan.</SectionHeading></Reveal>
        <Reveal delay={0.1}>
          <div className="mt-5 space-y-4 text-[var(--color-fg-muted)] leading-relaxed">
            {bio.map((para, i) => <p key={i}>{para}</p>)}
            <p className="text-[var(--color-fg-subtle)]">{now}</p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap gap-2">{tools.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        </Reveal>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: `src/app/page.tsx`** — compose the home page.

```tsx
import { Hero } from "@/components/home/Hero";
import { ProjectGrid } from "@/components/home/ProjectGrid";
import { AboutSection } from "@/components/home/AboutSection";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProjectGrid />
      <AboutSection />
    </main>
  );
}
```

(The `#contact` section is the `<Footer/>` rendered by the layout, so the nav's "Contact" anchor resolves.)

- [ ] **Step 3: Verify**

`npm run dev` → home page scrolls hero → work grid → about → footer; nav anchors jump correctly; reveals fire on scroll. Then `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/AboutSection.tsx src/app/page.tsx
git commit -m "feat: about section + assembled home page"
```

---

## Chunk 5: Project detail pages

### Task 13: Frames — BrowserFrame, PhoneFrame

**Files:**
- Create: `src/components/project/BrowserFrame.tsx`
- Create: `src/components/project/PhoneFrame.tsx`

- [ ] **Step 1: `src/components/project/BrowserFrame.tsx`**

Wraps children in a faux browser chrome: a top bar with three traffic-light dots and a URL pill (pass `url` text), then the content area with rounded corners + border + `--shadow-glow`. `aria-hidden` on the chrome decorations.

```tsx
import { cn } from "@/lib/cn";

export function BrowserFrame({ url, children, className }: { url?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-bg-2)] shadow-[var(--shadow-glow)]", className)}>
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-2)_60%,white_4%)] px-3 py-2.5" aria-hidden>
        <div className="flex gap-1.5">
          {["#ff5f57","#febc2e","#28c840"].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}
        </div>
        {url && <div className="flex-1 truncate rounded-md bg-[var(--color-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-fg-subtle)]">{url}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/project/PhoneFrame.tsx`**

A tall iPhone-ish bezel: rounded ~2.5rem corners, thick dark border, a notch pill at the top, fixed aspect ~`9/19.5`, content clipped inside.

```tsx
import { cn } from "@/lib/cn";

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-[220px] overflow-hidden rounded-[2.4rem] border-[8px] border-[#1c1d2e] bg-black shadow-[var(--shadow-glow)]", className)}>
      <div aria-hidden className="absolute left-1/2 top-2 z-10 h-3.5 w-14 -translate-x-1/2 rounded-b-xl bg-[#1c1d2e]" />
      <div className="aspect-[9/19.5]">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck & commit**

`npx tsc --noEmit`.
```bash
git add src/components/project
git commit -m "feat: browser + phone frame components"
```

---

### Task 14: ActionButtons + ProjectHero

**Files:**
- Create: `src/components/project/ActionButtons.tsx`
- Create: `src/components/project/ProjectHero.tsx`

- [ ] **Step 1: `src/components/project/ActionButtons.tsx`**

Given `links: ProjectLinks`, render — in this order, each only if its URL is present — `Button` primary `Launch app` (→ `live`, external), secondary `Try interactive demo` (→ `demo`, external), secondary `App Store` (→ `appStore`, external), ghost `View source` (→ `source`, external). All external, so `↗` is appended automatically by `Button`.

```tsx
import { Button } from "@/components/ui/Button";
import type { ProjectLinks } from "@/content/projects.types";

export function ActionButtons({ links }: { links: ProjectLinks }) {
  return (
    <div className="flex flex-wrap gap-3">
      {links.live && <Button href={links.live} external>Launch app</Button>}
      {links.demo && <Button href={links.demo} external variant="secondary">Try interactive demo</Button>}
      {links.appStore && <Button href={links.appStore} external variant="secondary">App Store</Button>}
      {links.source && <Button href={links.source} external variant="ghost">View source</Button>}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/project/ProjectHero.tsx`**

Top of the detail page. A meta line (`category · period · role`) as a `SectionLabel`-styled string, the project name in display font (large), the `summary` paragraph (muted, max-w), then `<ActionButtons links={project.links} />`. Optionally a faint full-bleed blurred version of `project.cover` behind it — keep subtle; or just rely on the global `GlowBackdrop`. Wrap in `Reveal`s.

```tsx
import { SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { ActionButtons } from "./ActionButtons";
import type { Project } from "@/content/projects.types";

export function ProjectHero({ project }: { project: Project }) {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-28 pb-12 md:pt-36">
      <Reveal><SectionLabel>{`${project.category} · ${project.period} · ${project.role}`}</SectionLabel></Reveal>
      <Reveal delay={0.05}>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-6xl">{project.name}</h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">{project.summary}</p>
      </Reveal>
      <Reveal delay={0.15}><div className="mt-8"><ActionButtons links={project.links} /></div></Reveal>
    </header>
  );
}
```

- [ ] **Step 3: Typecheck & commit**

`npx tsc --noEmit`.
```bash
git add src/components/project/ActionButtons.tsx src/components/project/ProjectHero.tsx
git commit -m "feat: project hero + conditional action buttons"
```

---

### Task 15: Gallery + BuildStory + ProjectPager

**Files:**
- Create: `src/components/project/Gallery.tsx`
- Create: `src/components/project/BuildStory.tsx`
- Create: `src/components/project/ProjectPager.tsx`

- [ ] **Step 1: `src/components/project/Gallery.tsx`**

Renders the project's media. If `project.frame === "browser"`: each screenshot goes inside a `BrowserFrame` (pass the host of `links.live` as the `url`, or just the project name). If `project.frame === "phone"`: screenshots go inside `PhoneFrame`s, laid out in a row that wraps. If `project.video` exists, render it first as an autoplaying muted looping `playsInline` `<video>` (inside the appropriate frame), with `poster` if provided. Use `next/image` with `width`/`height` from the data (not `fill`) so intrinsic sizing works inside frames; cap display width with CSS. Layout: a single column of frames on mobile; for `browser` projects, one per row (they're wide); for `phone` projects, a `flex flex-wrap gap-6 justify-center`. Wrap each item in `Reveal`.

```tsx
import Image from "next/image";
import { BrowserFrame } from "./BrowserFrame";
import { PhoneFrame } from "./PhoneFrame";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import type { Project } from "@/content/projects.types";

function hostOf(url?: string) { try { return url ? new URL(url).host : undefined; } catch { return undefined; } }

export function Gallery({ project }: { project: Project }) {
  const isPhone = project.frame === "phone";
  const Frame = ({ children }: { children: React.ReactNode }) =>
    isPhone ? <PhoneFrame>{children}</PhoneFrame> : <BrowserFrame url={hostOf(project.links.live)}>{children}</BrowserFrame>;
  return (
    <Section className="!py-12">
      <div className={isPhone ? "flex flex-wrap justify-center gap-6" : "space-y-8"}>
        {project.video && (
          <Reveal>
            <Frame>
              <video className={isPhone ? "block h-full w-full object-cover" : "block aspect-video w-full object-cover"} src={project.video.src} poster={project.video.poster} autoPlay muted loop playsInline />
              {/* aspect-video gives the browser-framed video an intrinsic height; the phone frame already constrains via aspect-[9/19.5] */}
            </Frame>
          </Reveal>
        )}
        {project.screenshots.map((s) => (
          <Reveal key={s.src}>
            <Frame>
              <Image src={s.src} alt={s.alt} width={s.width} height={s.height} className="block h-auto w-full" />
            </Frame>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: `src/components/project/BuildStory.tsx`**

A `Section` with three labeled blocks rendered from the data: **Problem** (`project.problem` paragraphs), **What I built** (`project.whatIBuilt` paragraphs), **Outcomes** (`project.outcomes` as a bulleted list). Plus a **Stack** row of `Tag`s from `project.stack`. Use `SectionLabel` for each block label and consistent spacing. Wrap blocks in `Reveal`.

```tsx
import { Section, SectionLabel } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import type { Project } from "@/content/projects.types";

function Prose({ paras }: { paras: string[] }) {
  return <div className="mt-3 space-y-4 text-[var(--color-fg-muted)] leading-relaxed">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>;
}

export function BuildStory({ project }: { project: Project }) {
  return (
    <Section className="space-y-12">
      <Reveal><div><SectionLabel>Problem</SectionLabel><Prose paras={project.problem} /></div></Reveal>
      <Reveal><div><SectionLabel>What I built</SectionLabel><Prose paras={project.whatIBuilt} /></div></Reveal>
      <Reveal>
        <div>
          <SectionLabel>Stack</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">{project.stack.map((s) => <Tag key={s}>{s}</Tag>)}</div>
        </div>
      </Reveal>
      <Reveal>
        <div>
          <SectionLabel>Outcomes</SectionLabel>
          <ul className="mt-3 space-y-2 text-[var(--color-fg-muted)]">
            {project.outcomes.map((o, i) => <li key={i} className="flex gap-3"><span aria-hidden className="text-[var(--color-accent)]">—</span><span>{o}</span></li>)}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
```

- [ ] **Step 3: `src/components/project/ProjectPager.tsx`**

Given `prev` and `next` `Project`s, render a two-up row of links to `/work/[slug]` ("← Previous · {prev.name}" and "Next · {next.name} →"), bordered top, inside a `max-w-5xl` container.

```tsx
import Link from "next/link";
import type { Project } from "@/content/projects.types";

export function ProjectPager({ prev, next }: { prev: Project; next: Project }) {
  return (
    <nav className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 border-t border-[var(--color-border)] px-6 py-12">
      <Link href={`/work/${prev.slug}`} className="group">
        <span className="text-xs text-[var(--color-fg-subtle)]">← Previous</span>
        <span className="mt-1 block font-[family-name:var(--font-display)] text-lg font-semibold transition-colors group-hover:text-[var(--color-fg)] text-[var(--color-fg-muted)]">{prev.name}</span>
      </Link>
      <Link href={`/work/${next.slug}`} className="group text-right">
        <span className="text-xs text-[var(--color-fg-subtle)]">Next →</span>
        <span className="mt-1 block font-[family-name:var(--font-display)] text-lg font-semibold transition-colors group-hover:text-[var(--color-fg)] text-[var(--color-fg-muted)]">{next.name}</span>
      </Link>
    </nav>
  );
}
```

- [ ] **Step 4: Typecheck & commit**

`npx tsc --noEmit`.
```bash
git add src/components/project/Gallery.tsx src/components/project/BuildStory.tsx src/components/project/ProjectPager.tsx
git commit -m "feat: project gallery, build story, pager"
```

---

### Task 16: The `/work/[slug]` route + `not-found`

**Files:**
- Create: `src/app/work/[slug]/page.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: `src/app/work/[slug]/page.tsx`**

- `generateStaticParams()` → `projects.map((p) => ({ slug: p.slug }))`.
- `generateMetadata({ params })` → look up the project; if missing, return minimal metadata; else set `title: project.name`, `description: project.summary`, and `openGraph`/`twitter` (the per-route `opengraph-image.tsx` from Task 18 supplies the image automatically).
- Default export: `async` component; `await params` (Next 15+ params are async); `const project = getProject(slug)`; if `!project` → `notFound()`. Then render `<ProjectHero>`, `<Gallery>`, `<BuildStory>`, and `<ProjectPager prev next>` from `adjacentProjects(slug)`.

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, getProject, adjacentProjects } from "@/content/projects";
import { ProjectHero } from "@/components/project/ProjectHero";
import { Gallery } from "@/components/project/Gallery";
import { BuildStory } from "@/components/project/BuildStory";
import { ProjectPager } from "@/components/project/ProjectPager";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Not found" };
  return { title: project.name, description: project.summary, openGraph: { title: project.name, description: project.summary }, twitter: { card: "summary_large_image" } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const adj = adjacentProjects(slug)!;
  return (
    <main>
      <ProjectHero project={project} />
      <Gallery project={project} />
      <BuildStory project={project} />
      <ProjectPager prev={adj.prev} next={adj.next} />
    </main>
  );
}
```

- [ ] **Step 2: `src/app/not-found.tsx`**

A centered message: "That page doesn't exist." + a `Button` back to `/#work` ("See the work →"). Keep it on-brand (display font, muted body).

```tsx
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">That page doesn&apos;t exist.</h1>
      <p className="mt-4 text-[var(--color-fg-muted)]">Maybe the project moved, or the link was mistyped.</p>
      <div className="mt-8"><Button href="/#work">See the work →</Button></div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

`npm run dev` → visit `/work/parahealth`, `/work/claruss` (phone frames), `/work/wedding`, `/work/grocery`, and a bogus `/work/nope` (renders the 404). Card links from the home grid work. Then `npx tsc --noEmit` and `npm run build` (build must statically generate all four `/work/*` routes).

- [ ] **Step 4: Commit**

```bash
git add src/app/work src/app/not-found.tsx
git commit -m "feat: /work/[slug] detail route + 404"
```

---

## Chunk 6: SEO, polish, tests, deploy

### Task 17: Favicon / app icon

**Files:**
- Create: `src/app/icon.svg` (and optionally `src/app/apple-icon.png`)
- Delete: `src/app/favicon.ico` if `create-next-app` left one

- [ ] **Step 1: Add an SVG app icon**

`src/app/icon.svg` — a simple monogram "DB" or a glyph on the `--color-bg` square with an accent gradient. Next.js serves it as the favicon automatically. Remove the default `favicon.ico` if present so there's no conflict.

- [ ] **Step 2: Verify & commit**

`npm run build`; check `/icon.svg` resolves.
```bash
git add src/app/icon.svg
git rm --cached src/app/favicon.ico 2>/dev/null || true
git commit -m "chore: app icon"
```

---

### Task 18: Open Graph images (`next/og`)

**Files:**
- Create: `src/app/opengraph-image.tsx` (site default)
- Create: `src/app/work/[slug]/opengraph-image.tsx` (per-project)

- [ ] **Step 1: Site default OG image — `src/app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#1a1c3d,#07070d)", color: "#e7e9f5", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#7e85bd" }}>{site.role}</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 16 }}>{site.name}</div>
        <div style={{ fontSize: 32, color: "#a3a8cd", marginTop: 16 }}>Software products that people actually use.</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: Per-project OG image — `src/app/work/[slug]/opengraph-image.tsx`**

Same idea, parameterized by `params.slug` via `getProject`; show the category kicker, the project name, and the tagline. Export `size`/`contentType` the same way. Handle missing slug by returning a generic card (it won't normally be hit since routes are statically generated).

```tsx
import { ImageResponse } from "next/og";
import { getProject } from "@/content/projects";

export { generateStaticParams } from "./page"; // prerender one OG image per project, matching the page route

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  const name = p?.name ?? "Dylan Burns";
  const kicker = p?.category ?? "Portfolio";
  const tagline = p?.tagline ?? "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#161a38,#07070d)", color: "#e7e9f5", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#7e85bd" }}>{kicker}</div>
        <div style={{ fontSize: 80, fontWeight: 700, marginTop: 14 }}>{name}</div>
        <div style={{ fontSize: 30, color: "#a3a8cd", marginTop: 16, maxWidth: 900 }}>{tagline}</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: Verify & commit**

`npm run build` (OG routes compile); optionally hit `/opengraph-image` and `/work/parahealth/opengraph-image` in dev to eyeball.
```bash
git add src/app/opengraph-image.tsx src/app/work/[slug]/opengraph-image.tsx
git commit -m "feat: OG images (site + per-project)"
```

---

### Task 19: `sitemap.ts` and `robots.ts`

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now },
    ...projects.map((p) => ({ url: `${site.url}/work/${p.slug}`, lastModified: now })),
  ];
}
```

- [ ] **Step 2: `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${site.url}/sitemap.xml` };
}
```

- [ ] **Step 3: Verify & commit**

`npm run build`; check `/sitemap.xml` and `/robots.txt` resolve in dev.
```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: sitemap + robots"
```

---

### Task 20: Playwright smoke test

**Files:**
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the smoke test**

```ts
import { test, expect } from "@playwright/test";

const SLUGS = ["parahealth", "claruss", "wedding", "grocery"];

test("home page renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /see my work/i })).toBeVisible();
  // project cards
  for (const s of SLUGS) await expect(page.locator(`a[href="/work/${s}"]`).first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("each project page renders with a launch action", async ({ page }) => {
  for (const s of SLUGS) {
    await page.goto(`/work/${s}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // at least one external "launch"/"app store" action exists
    await expect(page.getByRole("link", { name: /launch app|app store/i }).first()).toBeVisible();
  }
});

test("unknown project slug shows the 404", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /doesn.t exist/i })).toBeVisible();
});

test("resume link points at the PDF", async ({ page }) => {
  await page.goto("/");
  const resume = page.getByRole("link", { name: /resume/i }).first();
  await expect(resume).toHaveAttribute("href", /\.pdf$/);
});

test("nav anchor links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Work", exact: true }).click(); // exact: don't also match the hero's "See my work →"
  await expect(page).toHaveURL(/#work$/);
});
```

- [ ] **Step 2: Run it**

Run: `npm run test:e2e`
Expected: all tests PASS (Playwright builds + starts the app via `webServer`). If the "nav anchor" test is flaky on mobile-collapsed nav, scope the selector to the desktop nav or set a desktop viewport — it's already `Desktop Chrome`, so it should be fine.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test: Playwright smoke tests"
```

---

### Task 21: Responsive + reduced-motion + a11y pass

**Files:** (touch-ups across components as needed — no new files expected)

- [ ] **Step 1: Reduced-motion check**

In the browser devtools, enable "Emulate prefers-reduced-motion: reduce". Reload `/` and `/work/parahealth`: no entrance animations, no page-transition motion, glow backdrop static, smooth-scroll off. Fix any component that still animates (every animating client component must consult `useReducedMotion()` or rely on the global CSS rule).

- [ ] **Step 2: Responsive check**

At 375px, 768px, 1280px widths: nav collapses to the menu button on mobile and the panel works; hero type scales; project grid is 1-col on mobile, 2-col on `md+`; about section stacks; galleries don't overflow horizontally (especially `browser`-framed wide screenshots — they should scale to container width); footer wraps cleanly. Fix overflow/spacing issues.

- [ ] **Step 3: Accessibility check**

Run an axe scan (e.g. the axe DevTools extension, or `npx @axe-core/cli http://localhost:3000` against `npm run start`) on `/` and a project page. Verify: one `<h1>` per page; landmarks present (`header`/`main`/`footer`); all images have non-empty `alt`; focus is visible on links/buttons; the mobile menu button has `aria-expanded`; color contrast for body text passes AA. Fix violations.

- [ ] **Step 4: Re-run everything**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && npm run test:e2e
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: responsive, reduced-motion, and a11y polish"
```

---

### Task 22: Deploy to Vercel

Use `vercel:deploy` / `vercel:deployments-cicd` guidance. (The Vercel CLI may need installing: `npm i -g vercel`.)

- [ ] **Step 1: Final local gate**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
All must pass.

- [ ] **Step 2: Link and deploy a preview**

```bash
vercel link        # create/link the project (framework auto-detected as Next.js)
vercel             # preview deployment
```
Open the preview URL; click through home → each project → launch buttons (they open the real external apps in new tabs) → 404.

- [ ] **Step 3: Promote to production**

```bash
vercel --prod
```

- [ ] **Step 4: Post-deploy follow-ups (note for the owner — not blocking)**

- Point the project at the chosen domain (e.g. `dylanburns.dev`) in the Vercel dashboard; then update `site.url` in `src/content/site.ts` and redeploy so canonical URLs / sitemap / OG `metadataBase` are correct.
- Replace placeholders from spec §9: project screenshots/videos, the grocery tracker URL, the résumé PDF, the bio + portrait, social links, and the Claruss App Store URL. Each swap should keep the Vitest data test green.
- When the Parahealth synthetic-data sandbox exists, set `links.demo` for `parahealth` to `https://demo.parahealth.app`.

- [ ] **Step 5: Commit any config produced by linking**

```bash
git add -A
git commit -m "chore: Vercel project link" || true
```

---

## Done criteria

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` all pass.
- Home page: hero, four project cards, about section, contact footer — responsive, with reveal animations that respect reduced motion.
- `/work/[slug]` for all four projects: hero with conditional action buttons, gallery in the right frame (browser vs phone), build story, prev/next pager.
- Unknown `/work/*` slug returns the styled 404.
- SEO: per-page metadata, site + per-project OG images, sitemap, robots, app icon.
- Deployed to Vercel (preview verified, then production).
- Open items from spec §9 are tracked as `TODO(owner)` comments in `src/content/*` and listed in Task 22 Step 4.
