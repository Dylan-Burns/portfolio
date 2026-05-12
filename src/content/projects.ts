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
      app: "https://parahealth.app",
      live: "https://parahealth.ai",
      // TODO(owner): point `demo` at https://demo.parahealth.app once the synthetic-data sandbox exists
    },
    cover: { src: "/projects/parahealth/cover.png", alt: "Parahealth marketing site", width: 1600, height: 1000 },
    screenshots: [
      // TODO(owner): add shot-app.png — a screenshot of the parahealth.app product (Work Items queue) for the "app" view
      { src: "/projects/parahealth/shot-technology.jpg", alt: "Parahealth — the marketing site (parahealth.ai): the end-to-end AI platform, clinical notes and EHR data in, authorization decisions out", width: 1600, height: 1000 },
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
    tagline: "Clarity without compromise — a screen-time blocker that actually holds the line.",
    summary:
      "Claruss blocks the apps and websites you choose on a schedule you set — with real, system-level enforcement, not a polite suggestion. Hardcore and Lockdown modes raise the stakes, an accountability partner can approve early unlocks, and a one-time passcode arrives by email or SMS when you genuinely need out. Built around intention and gentle friction, not another guilt-trip chart.",
    category: "iOS · Consumer",
    role: "Developer",
    period: "2026 – now",
    frame: "phone",
    links: {
      live: "https://www.claruss.app/",
      appStore: "https://apps.apple.com/us/app/claruss/id6756468602",
    },
    cover: { src: "/projects/claruss/cover.jpg", alt: "Claruss website", width: 1600, height: 1000 },
    screenshots: [
      { src: "/projects/claruss/shot-focus.png", alt: "Claruss — an active focus session counting down, with blocked apps and an Unlock button", width: 770, height: 1666 },
      { src: "/projects/claruss/shot-rules.png", alt: "Claruss — active blocking rules (Deep Work, Bedtime) with schedules and blocked apps", width: 770, height: 1666 },
      { src: "/projects/claruss/shot-templates.png", alt: "Claruss — starter rule templates: Bedtime, Deep Work, Morning Routine, School Hours", width: 770, height: 1666 },
      { src: "/projects/claruss/shot-activity.png", alt: "Claruss — weekly screen-time breakdown by category and most-used apps", width: 770, height: 1666 },
      { src: "/projects/claruss/shot-partner.png", alt: "Claruss — add an accountability partner who approves unlock requests", width: 770, height: 1666 },
      { src: "/projects/claruss/shot-settings.png", alt: "Claruss — settings: subscription, unlock-code delivery, Hardcore and Lockdown modes", width: 770, height: 1666 },
    ],
    problem: [
      "Screen-time dashboards are guilt machines: lots of data, no behavior change. People want to use their phones more deliberately, not just feel bad about a number.",
      "And most blockers are trivially defeated — one tap to “ignore for today” and the willpower tax lands right back on you.",
    ],
    whatIBuilt: [
      "A native app for iPhone — with Apple Silicon Mac and Vision Pro support — built on Apple's Screen Time / Family Controls APIs: pick the apps and Safari sites to block, set a recurring schedule, and let the system enforce it.",
      "Designed the friction to be adjustable rather than absolute — Hardcore mode locks rules in place during a cooldown window, Lockdown mode flips to an allow-list, and an accountability partner can sign off on early unlocks. When you truly need out, a one-time passcode is delivered by email or SMS.",
      "Shipped to the App Store solo — product, design, and engineering — with a 14-day Pro trial that doesn't ask for a card, and iterated from real usage. The app collects no user data.",
    ],
    stack: ["Swift", "SwiftUI", "Screen Time API (Family Controls)", "iOS / macOS / visionOS"],
    outcomes: [
      "Live on the App Store — free, with a Claruss Pro subscription ($4.99/mo or $29.99/yr).",
      "Runs on iPhone, plus Apple Silicon Macs and Apple Vision Pro.",
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
    cover: { src: "/projects/wedding/cover.jpg", alt: "Wedding website", width: 1600, height: 1000 },
    screenshots: [{ src: "/projects/wedding/shot-1.svg", alt: "Wedding website — landing", width: 1600, height: 1000 }],
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
