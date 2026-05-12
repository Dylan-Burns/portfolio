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
    outcomes: ["Launched and available on the iOS App Store.", "Designed, built, and shipped solo."],
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
