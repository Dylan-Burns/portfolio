# Watchtower case study — design

**Date:** 2026-07-26
**Status:** Approved

## Goal

Add a new project, **Watchtower**, to the portfolio as a full internal case study at
`/work/watchtower`, matching the depth of the Steamhouse case study (problem,
what-I-built, architecture, stack, outcomes, and a tabbed feature tour).

Watchtower (repo: `Dylan-Burns/polylane`) is an AI incident investigator that runs
24/7 on Cloudflare Workers: it simulates a six-service microservice world ("Acme
Shop"), detects anomalies with median+MAD statistical baselines, and escalates
incidents to a Claude tool-use agent that investigates telemetry and writes a
root-cause report. Live at https://watchtower.dylanburns.workers.dev.

## Decisions (user-approved)

- **Media:** Claude captures the cover + feature-tour screenshots from the live
  site with Playwright. Triggering one **Bad deploy** chaos scenario for a live
  incident capture is approved (~$0.10–0.40 Anthropic API cost), followed by
  approving the rollback to restore the world.
- **Placement:** second in the projects array, immediately after Parahealth.
- **Links:** `live` → https://watchtower.dylanburns.workers.dev and `source` →
  https://github.com/Dylan-Burns/polylane. First project on the site with a public
  source link.
- **Depth:** full Steamhouse-style case study including an `architecture` section.

## Changes

### 1. `src/content/projects.types.ts`

Add one `ProjectCategory` literal: `"AI · Infrastructure"`. (CRT comment tag
derives to `ai` — unused by other projects.)

### 2. `src/content/file-items.ts`

Add to `LABEL_OVERRIDES`: `watchtower: "watchtower.workers.dev"` — domain-style
label consistent with the other projects, shortened from the full
`watchtower.dylanburns.workers.dev` to fit the CRT line.

### 3. `src/content/projects.ts` — new entry after Parahealth

Fixed fields:

| Field | Value |
|---|---|
| slug | `watchtower` |
| name | `Watchtower` |
| category | `AI · Infrastructure` |
| role | `Builder` |
| period | `2026` |
| frame | `browser` |
| links | live + source (above) |
| cover | `/projects/watchtower/cover.png` |
| screenshots | `[]` (tour replaces it) |

Copy plan (final wording at implementation, sourced from the repo README):

- **Tagline:** "An AI incident investigator that runs 24/7 on Cloudflare Workers —
  statistical detection hands incidents to a Claude agent that root-causes them."
- **Summary:** 2–3 sentences: the self-demoing watchdog — simulated world, chaos
  panel, detection → agent investigation → root-cause report with a human approval
  gate on remediation.
- **problem** (2 ¶): incident investigation is high-toil on-call work done under
  pressure; and the demo problem — an incident agent can't be shown off without a
  production to break, so Watchtower ships its own breakable world.
- **whatIBuilt** (3 ¶): the simulated six-service world + chaos panel (four fault
  scenarios, red-herring deploys, deterministic generator, 24h backfill); the
  detection pipeline (median+MAD baselines, evidence gates, ~107s measured
  inject-to-incident); the agent (7 read-only tools, live investigation timeline,
  report with clickable evidence chips, human approval gate, incident-scoped "Dig
  deeper" chat).
- **architecture** (4 ¶, the centerpiece):
  1. Topology — one Worker (Hono API), SimulatorDO singleton generating spans /
     logs / rollups into D1, 1-minute cron detector, InvestigatorDO running the
     Claude loop, React/Vite SPA on Workers assets; why D1-only (the agent's tools
     are SQL questions).
  2. Detection math — hard-trip + sustained rule families each paired with an
     evidence gate; p50 distribution-shift confirmation kills the dominant
     false-positive mode; detection anchored on the newest rollup minute rather
     than wall clock (a real go-live bug).
  3. Agent loop — domain-agnostic loop with an LLM seam; verified prompt caching
     (~2 uncached input tokens per step after the first; $0.10–0.40 per full
     investigation); budgets tracked across resumes; DO-persisted state so
     investigations survive eviction.
  4. Honesty and safety — symptom-only error logs with causal propagation (the
     agent reasons from evidence, never reads the answer); read-only tools by
     construction with the single mutating action behind a re-validating human
     approval gate; server-loaded chat context so fabricated incident history
     can't be smuggled in.
- **stack:** TypeScript, Cloudflare Workers, Durable Objects, D1 (SQLite), Hono,
  React, Vite, Anthropic Claude, Vitest.
- **outcomes** (3–4 bullets): 4/4 fault scenarios correctly root-caused in the
  production eval (5–7 tool calls, ~45–78s investigation wall clock, 107s measured
  inject-to-incident, exoneration-aware grading rubric); verified prompt caching
  making a full investigation cost ~$0.10–0.40; designed, built, evaluated, and
  shipped solo in under a week.

### 4. Screenshots — `public/projects/watchtower/`

Captured with Playwright from the live site at ~2000px width (matching Steamhouse
tour assets). Cover plus a 4-tab tour:

| Tab | Shows |
|---|---|
| System | Dashboard: six services, galaxy topology, analytics row |
| Chaos | Chaos panel + deploys rail with the red-herring deploy |
| Incident | Incident detail: metric evidence tiles + live investigation timeline |
| Report | Root-cause report with evidence chips + "Dig deeper" chat |

Prefer the seeded resolved incident for report shots; trigger one Bad deploy only
if a live critical incident is needed, then approve the rollback.

## Testing

- `npm test` (vitest): `tests/unit/projects.test.ts` validates the new entry —
  images exist on disk with positive dimensions, tour tabs complete, links
  absolute, unique slug. `tests/unit/file-items.test.ts` covers the CRT mapping.
- Production build (`npm run build`) passes.
- Playwright smoke (`tests/e2e/smoke.spec.ts`) passes.

## Out of scope

- No changes to case-study page components — the existing `/work/[slug]` renderer
  and tour UI handle everything this entry needs.
- No demo video (can be added later as a `video.embed`).
- No changes to other projects' content or ordering beyond the insertion.
