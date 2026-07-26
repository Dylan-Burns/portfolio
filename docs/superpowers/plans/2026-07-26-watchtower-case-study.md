# Watchtower Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Watchtower project (AI incident investigator on Cloudflare Workers, repo `Dylan-Burns/polylane`) as a full case study at `/work/watchtower`, second in the project list.

**Architecture:** Pure content addition — one new `ProjectCategory` literal, one CRT label override, one new entry in the `projects` array, and a set of screenshots captured from the live site. The existing `/work/[slug]` renderer, tour UI, and CRT file list handle everything else. Spec: `docs/superpowers/specs/2026-07-26-watchtower-project-design.md`.

**Tech Stack:** Next.js content files (TypeScript), Playwright (`@playwright/test` 1.60, already installed) for screenshot capture, Vitest for validation.

## Global Constraints

- Category string is exactly `"AI · Infrastructure"` (separator is `·` U+00B7 with spaces, same as existing categories).
- CRT label override is exactly `watchtower.workers.dev`.
- The new entry is inserted **immediately after the `parahealth` object** in the `projects` array (before `claruss`).
- Links: live `https://watchtower.dylanburns.workers.dev` · source `https://github.com/Dylan-Burns/polylane`.
- All images live under `public/projects/watchtower/` and are referenced as `/projects/watchtower/...`; captured at viewport 2000×1250 so intrinsic size is 2000×1250 unless measured otherwise.
- `tests/unit/projects.test.ts` requires: every referenced image exists on disk, non-empty alt text, positive dimensions, tour tabs have title/blurb/≥1 view, links absolute, slugs unique. Do not weaken any test.
- Commit trailer for all commits:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01GiBVrG3zp3vY5f82VVwcxZ`

---

### Task 1: Capture screenshots from the live site

> **Descope note (2026-07-26, user-approved):** executed with a 4/9 outcome. The four
> healthy-world shots (cover, system-1-galaxy, system-2-grid, chaos-1-panel, all
> 2000×1250) are captured and committed (`b9271c9`). The five incident/report shots are
> **deferred**: the live detector never opened an incident after the approved injection
> (suspected baseline contamination from a stale long-running fault; `/api/deploys` also
> returned empty — possible site regression). Task 2 ships a two-tab tour (System, Chaos)
> accordingly; the Incident/Report tabs return once the live site is verified healthy.

Interactive/judgment-heavy — best executed inline (main session), not by a fire-and-forget subagent. Triggering **one** Bad-deploy scenario is user-approved (~$0.10–0.40 of the owner's Anthropic API credit). Restore the world afterwards via the report's **Approve** button.

**Files:**
- Create: `public/projects/watchtower/cover.png`
- Create: `public/projects/watchtower/tour/system-1-galaxy.png`
- Create: `public/projects/watchtower/tour/system-2-grid.png`
- Create: `public/projects/watchtower/tour/chaos-1-panel.png`
- Create: `public/projects/watchtower/tour/chaos-2-deploys.png`
- Create: `public/projects/watchtower/tour/incident-1-evidence.png`
- Create: `public/projects/watchtower/tour/incident-2-timeline.png`
- Create: `public/projects/watchtower/tour/report-1-verdict.png`
- Create: `public/projects/watchtower/tour/report-2-chat.png`
- Create (scratch, not committed): `<scratchpad>/watchtower-capture.mjs`

**Interfaces:**
- Consumes: the live site `https://watchtower.dylanburns.workers.dev` (UI landmarks per its README: System panel with **Galaxy | Grid** toggle, **Chaos** panel with a **Bad deploy** button, **Deploys** rail, incident feed, incident page with metric evidence tiles + timeline + report + **Dig deeper** thread + **Approve**).
- Produces: the nine PNGs above at 2000px width; their exact measured dimensions (needed verbatim by Task 2).

- [ ] **Step 1: Create the asset directory**

```bash
mkdir -p public/projects/watchtower/tour
```

- [ ] **Step 2: Write the capture script (healthy-world shots)**

Write `<scratchpad>/watchtower-capture.mjs`. Selectors are best-effort from the README's UI copy — if one fails, take `await page.screenshot()` + `await page.content()` to discover the real text/roles and adjust; the file list above is the contract, the selectors are not.

```js
import { chromium } from "@playwright/test";

const BASE = "https://watchtower.dylanburns.workers.dev";
const OUT = "public/projects/watchtower";
const phase = process.argv[2] ?? "healthy";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1250 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // let the particle topology settle

if (phase === "healthy") {
  // Cover + System tab: galaxy topology over the analytics row
  await page.screenshot({ path: `${OUT}/cover.png` });
  await page.screenshot({ path: `${OUT}/tour/system-1-galaxy.png` });
  // Grid view of the same topology
  await page.getByText("Grid", { exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/tour/system-2-grid.png` });
  // Chaos panel in frame
  await page.getByText("Bad deploy").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/tour/chaos-1-panel.png` });
}

if (phase === "inject") {
  await page.getByText("Bad deploy").first().scrollIntoViewIfNeeded();
  await page.getByText("Bad deploy").first().click();
  console.log("fault injected — detection lands in ~2 min");
}

if (phase === "deploys") {
  // After the report names the culprit: deploys rail with the "suspected cause" flag
  await page.getByText(/suspected cause/i).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/tour/chaos-2-deploys.png` });
}

await browser.close();
```

- [ ] **Step 3: Capture the healthy world**

Run: `node <scratchpad>/watchtower-capture.mjs healthy`
Expected: `cover.png`, `system-1-galaxy.png`, `system-2-grid.png`, `chaos-1-panel.png` exist. Eyeball each (Read the PNGs) — no blank frames, no half-loaded panels; re-shoot if needed.

- [ ] **Step 4: Inject the fault**

Run: `node <scratchpad>/watchtower-capture.mjs inject`
Expected: console line `fault injected`. The detector opens a critical incident in ~2 minutes (measured 107s inject→incident).

- [ ] **Step 5: Capture the live incident (interactive, time-sensitive)**

Investigation wall clock is only ~45–80s, so catching the timeline mid-run means acting as soon as the incident opens. Do this with the Playwright MCP browser tools (or an interactive script session), not a blind script:

1. Reload the dashboard ~90s after injection; watch for the "watchdog scanning…" state / the new **critical** incident in the feed.
2. Open the incident page immediately.
3. Shoot `tour/incident-1-evidence.png` — metric evidence tiles charting each anomaly against its baseline.
4. Shoot `tour/incident-2-timeline.png` — the timeline advancing as the agent calls tools (`query_metrics`, `find_traces`, …). If the investigation finishes before you catch it live, the completed timeline is an acceptable fallback — it still shows every tool call.
5. When the report renders: `tour/report-1-verdict.png` — summary, root cause, blast radius, confidence, suggested action, evidence chips.
6. Scroll to the **Dig deeper** thread; optionally ask one question (e.g. "which deploy caused this?") and shoot `tour/report-2-chat.png` with the streamed answer visible.
7. Back on the dashboard: run `node <scratchpad>/watchtower-capture.mjs deploys` for `tour/chaos-2-deploys.png` (culprit deploy flagged **suspected cause** beside the red-herring catalog deploy).

All shots at the same 2000×1250 viewport.

- [ ] **Step 6: Restore the world**

Click **Approve** on the report's suggested action (the human approval gate executes the rollback; the approval lands on the investigation timeline). Confirm on the dashboard that services green out and the incident auto-resolves within ~5 minutes. Fallback: the Chaos panel's **Restore** button.

- [ ] **Step 7: Verify dimensions and record them**

```bash
for f in public/projects/watchtower/cover.png public/projects/watchtower/tour/*.png; do
  sips -g pixelWidth -g pixelHeight "$f" | tr '\n' ' '; echo "$f"
done
```

Expected: 2000×1250 each. Record any deviating file's actual numbers — Task 2's entry must carry the **measured** dimensions.

- [ ] **Step 8: Commit**

```bash
git add public/projects/watchtower
git commit -m "feat: watchtower case-study screenshots"
```

---

### Task 2: Add the Watchtower project data (TDD)

**Files:**
- Modify: `src/content/projects.types.ts:1-7` (ProjectCategory union)
- Modify: `src/content/file-items.ts:13-19` (LABEL_OVERRIDES)
- Modify: `src/content/projects.ts` (new entry after the `parahealth` object, which ends at the line `},` before the `claruss` entry)
- Test: `tests/unit/projects.test.ts:19-22`
- Test: `tests/unit/file-items.test.ts:23-34`

**Interfaces:**
- Consumes: the four PNGs from Task 1 (cover, tour/system-1-galaxy, tour/system-2-grid, tour/chaos-1-panel), all measured at exactly 2000×1250.
- Produces: `projects` array exporting a `watchtower` entry (slug `"watchtower"`) at index 1; `LABEL_OVERRIDES.watchtower === "watchtower.workers.dev"`; `ProjectCategory` includes `"AI · Infrastructure"`.

- [ ] **Step 1: Extend the tests to expect watchtower (failing first)**

In `tests/unit/projects.test.ts`, extend the expected-slugs assertion:

```ts
  it("has at least the four expected projects", () => {
    const slugs = projects.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["parahealth", "watchtower", "claruss", "cartlords"]));
  });
```

In `tests/unit/file-items.test.ts`, add a case to the overrides test:

```ts
    const cases = [
      { name: "Parahealth", href: "/work/parahealth", label: "parahealth.ai" },
      { name: "Watchtower", href: "/work/watchtower", label: "watchtower.workers.dev" },
      { name: "Claruss", href: "/work/claruss", label: "claruss.app" },
      { name: "Cartlords", href: "/work/cartlords", label: "cartlords.com" },
    ];
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `projects.test.ts` (missing `watchtower` slug) and `file-items.test.ts` (no Watchtower item).

- [ ] **Step 3: Add the category literal**

In `src/content/projects.types.ts`:

```ts
export type ProjectCategory =
  | "Healthcare · AI"
  | "AI · Infrastructure"
  | "AgTech · Platform"
  | "Wellness · iOS"
  | "Commerce · Web"
  | "Web · Personal"
  | "Web · Side project";
```

- [ ] **Step 4: Add the CRT label override**

In `src/content/file-items.ts`:

```ts
const LABEL_OVERRIDES: Record<string, string> = {
  parahealth: "parahealth.ai",
  watchtower: "watchtower.workers.dev",
  claruss: "claruss.app",
  cartlords: "cartlords.com",
  steamhouse: "steamhouse.app",
};
```

- [ ] **Step 5: Insert the project entry**

In `src/content/projects.ts`, immediately after the closing `},` of the `parahealth` object, insert the complete entry below. Where a width/height differs from Task 1's measurements, use the measured value.

```ts
  {
    slug: "watchtower",
    name: "Watchtower",
    tagline:
      "An AI incident investigator that runs 24/7 on Cloudflare Workers — statistical detection hands incidents to a Claude agent that root-causes them.",
    summary:
      "Watchtower is a self-demoing production watchdog: a simulated six-service world it watches, breaks on demand, and heals. A chaos panel injects faults; a statistical detector catches the anomaly within a couple of minutes and escalates to a Claude tool-use agent that investigates the telemetry — metrics, logs, traces, deploys — and writes a root-cause report with evidence you can click. The agent only ever suggests: the one mutating action, rolling back the fault, sits behind a human approval gate.",
    category: "AI · Infrastructure",
    role: "Builder",
    period: "2026",
    frame: "browser",
    links: {
      live: "https://watchtower.dylanburns.workers.dev",
      source: "https://github.com/Dylan-Burns/polylane",
    },
    cover: { src: "/projects/watchtower/cover.png", alt: "Watchtower — live dashboard: six-service particle topology over incident analytics", width: 2000, height: 1250 },
    screenshots: [],
    // TODO(owner): add Incident + Report tour tabs (evidence tiles, live investigation
    // timeline, root-cause report, Dig deeper chat) once the live detector is verified
    // healthy — see docs/superpowers/plans/2026-07-26-watchtower-case-study.md Task 1.
    tour: [
      {
        title: "System",
        blurb:
          "The live world at a glance — six services in a particle galaxy where cluster size tracks request rate and errors circulate as red particles, over an analytics row of incident volume, time-to-diagnose, and live traffic.",
        views: [
          { src: "/projects/watchtower/tour/system-1-galaxy.png", alt: "Watchtower — System panel, galaxy view: six service clusters sized by request rate, with incident analytics above", width: 2000, height: 1250, caption: "Galaxy view" },
          { src: "/projects/watchtower/tour/system-2-grid.png", alt: "Watchtower — System panel, grid view of the six services with rate, error, and p95 sparklines", width: 2000, height: 1250, caption: "Grid view" },
        ],
      },
      {
        title: "Chaos",
        blurb:
          "Four one-click fault scenarios — bad Worker deploy, dependency outage, latency creep, traffic spike — each propagating causally through the topology alongside red-herring deploys the agent has to rule out.",
        views: [
          { src: "/projects/watchtower/tour/chaos-1-panel.png", alt: "Watchtower — Chaos panel: four injectable fault scenarios with per-scenario Trigger buttons", width: 2000, height: 1250, caption: "Chaos panel" },
        ],
      },
    ],
    problem: [
      "When production breaks, the first thirty minutes are the worst: someone gets paged, pulls up five dashboards, greps logs under pressure, and tries to guess which of today's deploys did it. Root-causing an incident is exactly the kind of evidence-gathering loop — query metrics, follow traces, rule out red herrings — that an LLM with tools can genuinely run on its own.",
      "But you can't demo an incident agent without an incident. Real production access is off the table for a showcase, and canned screenshots prove nothing. Watchtower's answer is to ship its own breakable world: a simulated microservice environment honest enough that the agent has to actually investigate — error logs never name the injected fault — and a chaos panel so anyone can trigger a real end-to-end run.",
    ],
    whatIBuilt: [
      "A simulated six-service e-commerce world (“Acme Shop”) owned by a Durable Object: a deterministic, seeded generator ticks every 20 seconds, writing spans, logs, and per-minute rollups into D1, with a 24-hour backfill so charts and baselines are populated from the first visit. Four injectable fault scenarios — bad deploy, dependency outage, latency creep, traffic spike — propagate errors causally through the topology, alongside red-herring deploys the agent has to rule out.",
      "A detection pipeline driven by a one-minute cron: median + MAD baselines per service, operation, and metric over the trailing 24 hours, with hard-trip and sustained rule families, each paired with an evidence gate to hold down false positives. Measured cold-start on the deployed world: 107 seconds from fault injection to an open incident.",
      "The investigator: a Claude tool-use loop holding seven read-only tools — metrics with baseline overlay, log search, trace trees, deploys, prior incidents. The UI streams the investigation live, each tool call landing on the incident timeline, and the finished report renders root cause, blast radius, confidence, and a suggested action with clickable evidence chips. Remediation is human-gated: the agent suggests a rollback; only an operator's Approve executes it. A “Dig deeper” chat, scoped to the incident's evidence, answers follow-ups.",
    ],
    architecture: [
      "The whole system is one Cloudflare Worker: a Hono API, two Durable Objects — a simulator that owns the world and an investigator that runs the agent — a one-minute cron for detection, and a React/Vite SPA served from Workers assets. D1 (SQLite) is the single source of truth for spans, logs, rollups, deploys, and the incident lifecycle. That's deliberate: the agent's tools are fundamentally SQL questions, so KV, R2, and Queues would add moving parts without adding capability.",
      "Detection pairs every ratio threshold with an evidence gate: a hard-trip rule needs one extreme minute plus a minimum error count; a sustained rule needs two consecutive breaching minutes. Latency rules additionally require a p50 distribution-shift confirmation — a single downstream-timeout span can lift a thin minute's p95 ten to thirty times over while leaving the median untouched, so requiring the median to move kills the dominant false-positive mode. And detection anchors on the newest minute actually present in the rollups, never wall-clock arithmetic — the simulator writes a closed minute up to ~20 seconds after the boundary, so wall-clock anchoring would evaluate an empty minute every tick (a real bug found at go-live).",
      "The investigation loop is domain-agnostic: it knows an LLM seam, a list of tools, and a budget. Prompt caching is measured, not assumed — a cache breakpoint on the byte-stable system prompt and the newest message means every step past the first reads the entire prior conversation from cache, leaving roughly two uncached input tokens per step, so a full investigation costs $0.10–0.40. Budgets (15 steps, a 4-minute wall clock, token caps) are tracked cumulatively across resumes, and every step persists to D1 plus Durable Object storage, so an investigation survives eviction and resumes mid-thought.",
      "The simulation is honest by construction: error logs are symptom-only — message templates never name the injected cause — and faults propagate causally through the service graph, so the agent reasons from evidence rather than reading the answer off a log line. Safety is structural too: every tool the agent holds is a read; the single mutating endpoint re-validates at click time so a stale approval can't kill a newer fault, and the incident chat loads its context server-side from D1, so a crafted request can't smuggle in fabricated history for the model to role-play against.",
    ],
    stack: [
      "TypeScript",
      "Cloudflare Workers",
      "Durable Objects",
      "D1 (SQLite)",
      "Hono",
      "React",
      "Vite",
      "Anthropic Claude",
      "Vitest",
    ],
    outcomes: [
      "4/4 fault scenarios correctly root-caused in the final production eval (gate: ≥3/4) — 5–7 tool calls and 45–78 seconds of investigation wall clock per incident, graded by an exoneration-aware rubric that catches false blame: naming the red herring to rule it out counts for the agent, blaming it counts against.",
      "Verified prompt caching brings a full multi-step investigation to roughly $0.10–0.40 of API spend, with per-step uncached input measured at ~2 tokens.",
      "An injected fault surfaces as an incident in about two minutes (107 seconds measured), from a 24/7 simulated world whose write budget sits comfortably inside D1's daily allowance.",
      "Designed, built, evaluated, and shipped solo in under a week — including the four-scenario eval harness that gates release.",
    ],
  },
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — including the image-existence checks against Task 1's files. If a dimension assertion or image path fails, fix the entry (not the test).

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: clean. (Catches a mistyped category literal or a missing field.)

- [ ] **Step 8: Commit**

```bash
git add src/content/projects.types.ts src/content/file-items.ts src/content/projects.ts tests/unit/projects.test.ts tests/unit/file-items.test.ts
git commit -m "feat: watchtower case study"
```

---

### Task 3: Full verification

**Files:**
- No new files; fixes only if verification fails.

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: a verified, committed feature on `main`.

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build succeeds; `/work/watchtower` appears in the generated routes.

- [ ] **Step 2: E2E smoke**

Run: `npm run test:e2e`
Expected: PASS. (The smoke suite covers the landing CRT list and project pages generically.)

- [ ] **Step 3: Visual check**

Run: `npm run dev`, then load `http://localhost:3000/work/watchtower` and the landing page. Verify: the CRT list shows `watchtower.workers.dev  // ai` second in the list; the case-study page renders the tour tabs (System / Chaos), the App Site + View source buttons, and the architecture section. Screenshot the page for the user. Stop the dev server.

- [ ] **Step 4: Final commit (only if fixes were needed)**

```bash
git add -A && git commit -m "fix: watchtower case-study polish"
```
