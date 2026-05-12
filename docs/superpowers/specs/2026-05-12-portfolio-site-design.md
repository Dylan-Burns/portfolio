# Dylan Burns — Portfolio Site · Design Spec

**Date:** 2026-05-12
**Status:** Approved (pending spec review)
**Owner:** Dylan Burns

## 1. Purpose & Positioning

A polished personal home base — "general personal brand," not optimized for a single funnel (job hunt / clients / fundraising). It introduces Dylan as a builder who ships real products end to end, and showcases four projects with room for each to breathe.

**Aesthetic:** Dark cinematic — deep indigo-to-black backgrounds, soft glow/gradient accents, gradient-text headlines, restrained motion. Feels like a modern product launch page, applied to a person.

**Non-goals:**
- No blog / writing section (can be added later; out of scope now).
- No contact form, no CMS, no auth, no database, no server-side data fetching.
- No embedded/iframed live apps — see §4.

## 2. Tech Stack

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**.
- **Tailwind CSS v4**, with a dark-cinematic design-token layer (CSS custom properties for palette, gradients, radii, shadows).
- **Framer Motion** for entrance reveals, hover lift/glow, and route transitions. All motion is gated behind `prefers-reduced-motion`.
- **`next/font`** — a grotesk/geometric sans for UI/body, plus a tight display weight for headings (e.g. Geist / General Sans / Inter family; final pick during implementation).
- **`next/image`** for all imagery (explicit dimensions, blur placeholders).
- **`next/og`** for per-project Open Graph images; plus `metadata`, `sitemap.ts`, `robots.ts`, favicon/app icons.
- No backend, no DB, no auth. Static rendering throughout.

**Decision — content authoring:** projects are defined in a typed TS data module (`src/content/projects.ts`), not MDX. Rationale: only four projects, consistent structure, type safety > prose flexibility here. MDX considered and rejected as overkill; revisit if a blog is added later.

**Decision — motion library:** Framer Motion (over CSS-only). Rationale: the cinematic aesthetic wants orchestrated reveals and smooth route transitions; ~30 KB is acceptable for this site. Accepted by owner.

## 3. Routes & Page Structure

| Route | Purpose |
|---|---|
| `/` | Home — hero, selected-work grid, about section, contact footer |
| `/work/[slug]` | Project detail page — one per project, statically generated |
| `not-found` | Friendly 404 (used for unknown project slugs and any other miss) |

There is no separate `/work` index or `/about` page; "Work" and "About" in the nav are anchor links to sections on `/`. "Resume" in the nav is a link to a static PDF (`/dylan-burns-resume.pdf`).

### 3.1 Home (`/`)

Top-to-bottom:
1. **Nav** — sticky; transparent over the hero, gains a blurred translucent background once scrolled. Links: `Work` · `About` · `Resume ↓` · `Contact`. Collapses to a compact menu on small screens.
2. **Hero** — gradient-text headline + supporting line + two CTAs (`See my work →`, `About me`). Ambient glow/gradient orb in the background (subtle, slow; disabled under reduced-motion). Headline/CTAs animate in on load.
3. **Selected work** — section label + heading, then a **2-column responsive project grid** (1 column on mobile) of `ProjectCard`s. Each card: cover image, project name, category tag, one-line tagline, and a `View case study →` affordance plus quick external links where relevant. Hover = lift + glow. Cards reveal on scroll into view.
4. **About** — photo, short bio, a row of tools/skills, and a "what I'm up to now" line.
5. **Contact footer** — large "Let's talk"-style heading, email link (`mailto:dylanburns1524@gmail.com`), and social links (GitHub `Dylan-Burns`; LinkedIn / X to be confirmed). Copyright line.

### 3.2 Project detail (`/work/[slug]`)

Single template, used by all four projects; only the data and the "launch" affordances differ.

1. **Nav** (same component as home; anchor links route back to `/#work` etc.).
2. **Project hero** — meta line (`category · period · role`), project name, summary paragraph, and an action row. Action buttons render conditionally from `links`:
   - `Launch app ↗` (→ `links.live`)
   - `App Store ↗` (→ `links.appStore`)
   - `View source ↗` (→ `links.source`)
   - `Try interactive demo ↗` (→ `links.demo`) — only when present
3. **Gallery** — screenshots (in an appropriate frame: browser chrome for web apps, iPhone frame for iOS apps) and an optional looping muted video. Layout adapts to how many assets exist.
4. **Build story** — structured blocks: **Problem** → **What I built** → **Stack** (chip list from `stack[]`) → **Outcomes** (bulleted from `outcomes[]`).
5. **Project nav** — previous / next project links (wrap around).

### 3.3 The four projects

| Slug | Name | Category | Role | "Launch" target | Asset treatment |
|---|---|---|---|---|---|
| `parahealth` | Parahealth | Healthcare · AI | Founder | `https://parahealth.ai` (marketing site) | Video walkthrough + product screenshots in a browser frame. A `links.demo` slot is reserved, to be pointed at `https://demo.parahealth.app` once a synthetic-data sandbox exists (out of scope for this build). |
| `claruss` | Claruss | iOS · Consumer | Founder | App Store URL (`https://claruss.app` and/or App Store link — to confirm) | iPhone-framed screenshots + screen-recording video. |
| `wedding` | Wedding site | Web · Personal | Builder | `https://wedding-ecru-mu.vercel.app/` | Screenshots in a browser frame; short scroll-through video optional. |
| `grocery` | Grocery tracker | Web · Side project | Builder | **URL TBD — needed from owner** | Screenshots in a browser frame. |

## 4. Live-App Strategy (resolved)

The portfolio does **not** embed apps in iframes. Rationale, recorded so it isn't relitigated:
- Many sites block framing (`X-Frame-Options` / CSP `frame-ancestors`); auth, cookies, and OAuth frequently break inside iframes.
- Responsive apps look cramped in a panel, and iframe-in-page on mobile is a poor experience.
- An iOS app (Claruss) can't be embedded at all — embedding the web apps would make the experience inconsistent.
- Each app is already its own deployment; linking out costs zero extra maintenance and lets each app shine in context.

Therefore: each project page does the storytelling (screenshots + short video + build story) and a prominent **"Launch app ↗"** opens the real deployment in a new tab. Parahealth, being auth-walled, links to its marketing site now, with the demo slot reserved for later.

## 5. Component Inventory

Shared/layout:
- `Nav` — sticky, scroll-aware blur background, responsive menu, resume link.
- `Footer` / `ContactSection` — heading, email, socials, copyright.
- `GlowBackdrop` / `GradientOrb` — reusable ambient background visuals; respect reduced-motion.
- `Reveal` — small wrapper around Framer Motion for scroll-into-view entrance animations (a single place to centralize the motion config + reduced-motion check).
- `PageTransition` — route-change transition wrapper in the root layout / template.

Home:
- `Hero`
- `ProjectGrid`
- `ProjectCard`
- `AboutSection`

Project detail:
- `ProjectHero` (incl. `ActionButtons`)
- `Gallery` (incl. `BrowserFrame`, `PhoneFrame` sub-components)
- `BuildStory` (incl. `StackChips`, `OutcomeList`)
- `ProjectPager` (prev/next)

UI primitives:
- `Button` / `LinkButton` (primary / secondary / ghost variants)
- `Tag` / `Chip`
- `SectionLabel`, `SectionHeading`

Each component should have a single clear purpose, take typed props, and be understandable without reading siblings. `Gallery`, `BuildStory`, and `Hero` are the most layout-heavy; if any grows unwieldy during implementation, split out the frame/sub-blocks as above rather than letting one file sprawl.

## 6. Data Model & Flow

`src/content/projects.ts` exports a typed, ordered array. Project shape (final field names may be refined during implementation, but this is the intent):

```ts
type ProjectCategory = 'Healthcare · AI' | 'iOS · Consumer' | 'Web · Personal' | 'Web · Side project';

interface ProjectLinks {
  live?: string;       // primary "Launch app" target
  appStore?: string;   // iOS App Store
  source?: string;     // public repo, if any
  demo?: string;       // optional interactive/sandbox demo (Parahealth, later)
}

interface ProjectImage { src: string; alt: string; width: number; height: number; }

interface Project {
  slug: string;
  name: string;
  tagline: string;            // one line, used on the card
  summary: string;            // 1–3 sentences, used in the detail hero
  category: ProjectCategory;
  role: string;               // e.g. "Founder", "Builder"
  period: string;             // e.g. "2024 – now", "2023"
  frame: 'browser' | 'phone'; // how gallery images are framed
  links: ProjectLinks;
  cover: ProjectImage;
  screenshots: ProjectImage[];
  video?: { src: string; poster?: string };
  problem: string;            // markdown-free prose (string[] of paragraphs is fine)
  whatIBuilt: string;
  stack: string[];
  outcomes: string[];
}
```

Flow: purely static. `/` maps over the array for cards; `/work/[slug]` uses `generateStaticParams()` from the array and `notFound()` when a slug doesn't match. No fetching at request time. Site/owner metadata (name, tagline, email, socials, resume path) lives in a small `src/content/site.ts`.

Assets: `public/projects/<slug>/cover.*`, `public/projects/<slug>/shot-1.*`, etc.; `public/dylan-burns-resume.pdf`; `public/og/` for generated images. Real assets come from the owner; the build ships with clearly-marked placeholders so it's runnable immediately.

## 7. Behavior, Accessibility, Error Handling

- **Reduced motion:** `prefers-reduced-motion: reduce` disables ambient orb animation, parallax, and auto-playing motion; entrance reveals degrade to instant (or a tiny fade). Centralized in the `Reveal`/motion config.
- **No-JS:** all content is server-rendered; animations are progressive enhancement. The site is fully readable and navigable without client JS.
- **Responsive:** 2-col grid → 1-col under ~768px; hero type scales down; nav collapses to a menu/button; galleries stack.
- **Accessibility:** semantic landmarks (`header`/`nav`/`main`/`footer`), logical heading order, visible focus states, keyboard-operable nav and any menu, alt text on every image, and a contrast-checked palette (the dark theme must clear WCAG AA for text).
- **Errors / edge cases:** unknown `/work/[slug]` → `not-found.tsx` with a short message and a link back to `/#work`. Missing optional links simply omit their buttons. Missing images use `next/image` with explicit dimensions + a blur/placeholder so layout never jumps.
- **External links:** open in a new tab with `rel="noopener noreferrer"` and a visible `↗` affordance.

## 8. Testing & Verification

It's a static marketing site, so verification is lightweight but real:
- `next build` (and `tsc --noEmit`) passes with zero type errors — treated as a gate.
- **Data test (Vitest):** every entry in `projects.ts` has all required fields, `slug`s are unique, every URL in `links` parses as a valid absolute URL, every image has non-empty `alt` and positive dimensions.
- **Smoke test (Playwright):** `/` renders without console errors; each `/work/[slug]` renders; the nav anchor links and the resume link resolve; an unknown slug renders the 404; the page is navigable by keyboard.
- **Manual pass:** axe (no critical violations) + Lighthouse (Performance & Accessibility ≥ 90 on the home and a project page).

Implementation follows TDD where it makes sense (the data validation test, in particular, can be written first against the schema).

## 9. Open Items (owner to provide; placeholders ship in the meantime)

- Screenshots / short videos for each of the four projects.
- The **Grocery tracker URL**.
- Resume PDF (`public/dylan-burns-resume.pdf`).
- Short bio + a photo for the About section.
- Which socials to link (GitHub `Dylan-Burns` confirmed; LinkedIn / X / others?).
- Claruss App Store URL (and confirm `claruss.app` vs. the App Store link as the primary target).
- Domain preference (e.g. `dylanburns.dev`) for the Vercel project.

None of these block scaffolding or building the site structure; they get swapped in as they arrive.

## 10. Build Sequence (high level — detailed plan to follow)

1. Scaffold Next.js (App Router, TS) + Tailwind v4 + `next/font`; base `layout.tsx`, theme tokens, global styles.
2. Design-system primitives: `Button`, `Tag`, `SectionLabel/Heading`, `GlowBackdrop`/`GradientOrb`, `Reveal`, `PageTransition`; `Nav` + `Footer`.
3. `src/content/site.ts` + `src/content/projects.ts` (with placeholder data/assets) and the Vitest data test.
4. Home page: `Hero` → `ProjectGrid`/`ProjectCard` → `AboutSection` → `ContactSection`.
5. `/work/[slug]` template: `ProjectHero`/`ActionButtons` → `Gallery` (`BrowserFrame`/`PhoneFrame`) → `BuildStory` → `ProjectPager`; wire all four projects.
6. Motion polish (reveals, hover, route transitions) + reduced-motion handling + responsive passes.
7. SEO: `metadata`, per-project `next/og` images, `sitemap.ts`, `robots.ts`, favicon/app icons.
8. Playwright smoke test; axe/Lighthouse pass; fix issues.
9. Deploy to Vercel; configure domain when chosen.
