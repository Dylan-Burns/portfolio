import type { Project } from "./projects.types";

export const projects: Project[] = [
  {
    slug: "parahealth",
    name: "Parahealth",
    tagline: "AI that automates prescription prior authorizations — chart in, a payer-ready PA out in minutes.",
    summary:
      "ParaHealth automates prior authorizations for prescription drugs, the hated, hours-per-patient paperwork pharmacy techs and clinic staff fight through for every script. A user uploads the patient's chart and picks the drug and payer. The product decides whether a PA is even required, verifies benefits with an automated AI phone call to the insurer, generates a completed payer-specific authorization in under five minutes with a confidence score on every answer, flags denial risk before it goes out, submits through whatever channel the payer accepts, and auto-drafts the appeal if it's denied. I designed and built the whole thing solo: frontend, backend, and the AI pipeline.",
    category: "Healthcare · AI",
    role: "Founder",
    period: "2026 – now",
    frame: "browser",
    links: {
      live: "https://parahealth.ai",
      docs: "https://www.parahealth.ai/learn-more",
    },
    // Demo-first showcase: a Loom walkthrough of the parahealth.app product, stacked with a clickable
    // window onto the marketing site (parahealth.ai).
    video: { embed: "https://www.loom.com/embed/7b8caa33492f49ebb433ba3c4ec2725d" },
    marketingSite: {
      href: "https://parahealth.ai",
      image: { src: "/projects/parahealth/shot-marketing.png", alt: "Parahealth marketing site (parahealth.ai) — AI built for prior authorization", width: 3830, height: 1796 },
    },
    cover: { src: "/projects/parahealth/cover.png", alt: "Parahealth marketing site", width: 1600, height: 1000 },
    // TODO(owner): add shot-app.png — a screenshot of the parahealth.app product (Work Items queue) for the "app" view
    screenshots: [],
    problem: [
      "Prior authorization is one of the most hated workflows in healthcare. For every prescription that needs one, pharmacy techs and clinic staff spend 15–45 minutes per patient: figuring out whether a PA is even required, calling the insurer to verify benefits, hunting data scattered across the chart to fill a payer-specific form, faxing it in, and drafting an appeal when it's denied.",
      "It's the single biggest source of staff burnout and a leading reason prescriptions get abandoned at the counter, and it's almost all repetitive, undifferentiated work. Across 50+ interviews with pharmacists and providers, the same story came back every time, and several asked when they could start using what I was building.",
    ],
    whatIBuilt: [
      "An end-to-end product that takes a pharmacy or clinic from prescription to a submitted, payer-ready PA. It ingests chart context, determines payer-specific requirements, generates the completed authorization with a confidence score on each answer, flags denial risk before submission, submits through fax, electronic, or phone, and auto-generates the appeal letter if the PA is denied.",
      "Benefit verification runs as an automated AI phone call that dials the payer and works through their phone tree, replacing the hold-music-and-clipboard step.",
      "I wrote every line myself: the React/Next.js reviewer UI, a FastAPI backend, the multi-model AI pipeline, and the payer and EHR integrations, all on PHI-handling, HIPAA-aligned infrastructure.",
    ],
    architecture: [
      "A multi-model AI pipeline does the clinical heavy lifting, each model matched to the cost and quality envelope of its task. Anthropic's Claude Sonnet generates PA answers from the chart, Opus handles appeal letters and complex clinical reasoning, and Haiku classifies incoming documents.",
      "Every answer carries a confidence score. High-confidence fields are auto-filled. Where the clinical notes don't clearly support an answer, the system surfaces it for human review rather than guessing, and the whole PA is scored for denial risk before it's ever submitted.",
      "Because it handles PHI, it's built for a regulated environment from the ground up: field-level encryption (Postgres + pgcrypto) on AWS RDS, S3 with SSE-KMS, immutable audit logs, role-based access control, and HIPAA-eligible AWS infrastructure, with SOC 2 underway. Integrations span Sinch (fax), Bland (AI voice for benefit-verification calls), Epic FHIR, and Resend.",
    ],
    stack: [
      "TypeScript",
      "Next.js",
      "React",
      "Tailwind CSS",
      "FastAPI",
      "Postgres",
      "Redis",
      "AWS",
      "Anthropic Claude",
    ],
    outcomes: [
      "Generates a completed, payer-ready prior authorization in under five minutes, down from the 15–45 minutes a tech spends today, a result that has held across different patient profiles and messy real-world note quality.",
      "On a real 166-question GLP-1 PA form (Zepbound), answers the form end-to-end against real de-identified patient records, with answer accuracy above 90% on high-confidence fields and low-evidence questions correctly routed to human review.",
      "Working product, built solo and validated through 50+ pharmacist and provider interviews, targeting a large, underserved wedge (roughly 180M prior authorizations submitted in the US each year).",
    ],
  },
  {
    slug: "claruss",
    name: "Claruss",
    tagline: "Clarity without compromise — a screen-time blocker that actually holds the line.",
    summary:
      "Claruss blocks the apps and websites you choose on a schedule you set — with real, system-level enforcement, not a polite suggestion. Hardcore and Lockdown modes raise the stakes, an accountability partner can approve early unlocks, and a one-time passcode arrives by email or SMS when you genuinely need out. Built around intention and gentle friction, not another guilt-trip chart.",
    category: "Wellness · iOS",
    role: "Developer",
    period: "2026 – now",
    frame: "phone",
    links: {
      live: "https://www.claruss.app/",
      appStore: "https://apps.apple.com/us/app/claruss/id6756468602",
    },
    cover: { src: "/projects/claruss/cover.jpg", alt: "Claruss website", width: 1600, height: 1000 },
    screenshots: [],
    // One iPhone you switch screens in — each tab is a screen of the app.
    tour: [
      {
        title: "Focus",
        blurb:
          "An active focus session counting down, with the apps it's blocking and an Unlock button — real, system-level enforcement, not a polite nudge.",
        views: [{ src: "/projects/claruss/shot-focus.png", alt: "Claruss — an active focus session counting down, with blocked apps and an Unlock button", width: 770, height: 1666 }],
      },
      {
        title: "Rules",
        blurb:
          "Your blocking rules — Deep Work, Bedtime — each with its own recurring schedule and set of blocked apps, enforced automatically on its window.",
        views: [{ src: "/projects/claruss/shot-rules.png", alt: "Claruss — active blocking rules (Deep Work, Bedtime) with schedules and blocked apps", width: 770, height: 1666 }],
      },
      {
        title: "Templates",
        blurb:
          "One-tap starter rules — Bedtime, Deep Work, Morning Routine, School Hours — so a useful block is two taps away instead of a setup chore.",
        views: [{ src: "/projects/claruss/shot-templates.png", alt: "Claruss — starter rule templates: Bedtime, Deep Work, Morning Routine, School Hours", width: 770, height: 1666 }],
      },
      {
        title: "Activity",
        blurb:
          "A weekly screen-time breakdown by category and most-used apps — the insight a dashboard gives, without turning into another guilt-trip.",
        views: [{ src: "/projects/claruss/shot-activity.png", alt: "Claruss — weekly screen-time breakdown by category and most-used apps", width: 770, height: 1666 }],
      },
      {
        title: "Partner",
        blurb:
          "Add an accountability partner who has to approve early-unlock requests — turning willpower into a shared commitment.",
        views: [{ src: "/projects/claruss/shot-partner.png", alt: "Claruss — add an accountability partner who approves unlock requests", width: 770, height: 1666 }],
      },
      {
        title: "Settings",
        blurb:
          "Subscription, one-time-code delivery by email or SMS, and the stricter Hardcore and Lockdown enforcement modes.",
        views: [{ src: "/projects/claruss/shot-settings.png", alt: "Claruss — settings: subscription, unlock-code delivery, Hardcore and Lockdown modes", width: 770, height: 1666 }],
      },
    ],
    problem: [
      "Screen-time dashboards are guilt machines: lots of data, no behavior change. People want to use their phones more deliberately, not just feel bad about a number.",
      "And most blockers are trivially defeated — one tap to “ignore for today” and the willpower tax lands right back on you.",
    ],
    whatIBuilt: [
      "A native iPhone app built on Apple's Screen Time / Family Controls APIs: pick the apps and Safari sites to block, set a recurring schedule, and let the system enforce it.",
      "Designed the friction to be adjustable rather than absolute — Hardcore mode locks rules in place during a cooldown window, Lockdown mode flips to an allow-list, and an accountability partner can sign off on early unlocks. When you truly need out, a one-time passcode is delivered by email or SMS.",
      "Shipped to the App Store solo — product, design, and engineering — with a 14-day Pro trial that doesn't ask for a card, and iterated from real usage. The app collects no user data.",
    ],
    stack: ["Swift", "SwiftUI", "Screen Time API (Family Controls)", "iOS", "Railway", "Postgres", "Redis", "Resend"],
    outcomes: [
      "Live on the App Store — free, with a Claruss Pro subscription ($4.99/mo or $29.99/yr).",
      "Designed, built, and shipped solo.",
    ],
  },
  /* hidden for now
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
  */
  {
    slug: "cartlords",
    name: "Cartlords",
    tagline: "Compare an entire grocery cart across every nearby store — and find the cheapest way to buy it.",
    summary:
      "Cartlords compares a whole grocery list across the stores near you using real, scraped prices, then finds the cheapest way to buy it, including splitting the cart across two or three stores. It shows the one thing grocery shopping never does: the full cross-store price picture for your actual list, normalized to a true per-unit cost so the comparison is honest. The live app is gated behind sign-in, so this case study leads with a walkthrough of the product.",
    category: "Commerce · Web",
    role: "Full-stack",
    period: "2025 – now",
    frame: "browser",
    // Gated behind sign-in, so the case study is the destination — no off-site button.
    links: {},
    // Demo-first showcase: the live site is gated, so this Loom walkthrough of the signed-in product leads the case study.
    video: { embed: "https://www.loom.com/embed/d45202c239e549d78e8253358331f77c" },
    cover: { src: "/projects/cartlords/cover.svg", alt: "Cartlords app", width: 1600, height: 1000 },
    // Video-led case study — the Loom walkthrough is the gallery; no static screenshots.
    screenshots: [],
    problem: [
      "Every grocery trip is a blind bet. You see one store's prices at a time, so you never know whether the same cart would have cost less somewhere else nearby. Loyalty apps and weekly circulars show isolated deals, not the total cost of your real list.",
      "Comparing is hard even by hand. The same item is priced by the pound at one store, as a six-count bag at another, and per-each at a third, so there's no obvious apples-to-apples number. That missing comparison is money left on the table on every trip.",
    ],
    whatIBuilt: [
      "A web app where you build a grocery list, set your location and a search radius, and instantly see what that exact list costs at each nearby store — broken down per item, with the cheapest store for every product and the best overall place to shop.",
      "The headline feature is multi-store optimization: it computes the best one-, two-, and three-store splits of your cart and shows the concrete savings versus shopping at a single store, plotted on a map of the stores around you.",
      "Underneath sits a full data pipeline — collect prices, normalize them to a comparable basis, and match the same product across stores — so every comparison reflects real equivalents rather than guesses.",
    ],
    architecture: [
      "Pricing data is the hard part, so the decision that mattered most was where to get it. Instead of building and maintaining a brittle scraper for every chain's own website, prices come from DoorDash's store pages, which share one consistent structure across retailers. That's one reliable extraction path instead of dozens of fragile, store-specific ones. A headless-browser scraper (Puppeteer) walks each store's listings and product details and writes raw, tokenized price records to MongoDB.",
      "The harder problem is making products comparable. DoorDash prices arrive in incompatible shapes: by the pound, by estimated weight, by count, or as a flat price. Each one gets classified by pricing type, then reduced to a single basis, price per standard unit (ounces for weight, fluid ounces for volume). Items sold per-each, like avocados, are converted to weight through a hand-curated table of roughly 500 average product weights, so a six-count bag, a per-pound price, and an each price all land on one comparable axis.",
      "Matching the same product across stores runs deterministic-first. A tokenizer normalizes and scores product names against a catalog of templates, and a Claude-based classifier backs up only the ambiguous cases. That keeps most matching cheap and reproducible while still absorbing messy real-world names.",
      "For a given list and location, a geospatial lookup finds the stores in range and an exact combinatorial search evaluates every one-, two-, and three-store split, ranking them by total cost with penalties for items a store doesn't carry. The frontend (Next.js, Mapbox) renders the per-item comparison table, per-store totals, and the best-value recommendation.",
    ],
    stack: [
      "TypeScript",
      "Next.js",
      "NestJS",
      "MongoDB",
      "Puppeteer",
      "Anthropic Claude",
      "Mapbox GL",
      "Tailwind CSS",
    ],
    outcomes: [
      "Turns an invisible, trip-by-trip guess into a clear per-store breakdown — plus an exact best one-, two-, or three-store split with a concrete “save $X vs. one store” headline.",
      "Sidesteps per-retailer scraping by collecting from DoorDash's uniform store pages: one extraction path instead of a brittle scraper per chain.",
      "Normalizes inconsistent pricing (per-pound, estimated-weight, per-each, flat) to a true price-per-ounce, so savings reflect real product equivalents — backed by pricing-type classification, a ~500-item average-weight table, and token-plus-LLM product matching.",
      "Private beta, built by a small team over roughly eight months — currently gated behind sign-in with Southern California coverage.",
    ],
  },
  {
    slug: "steamhouse",
    name: "Steamhouse",
    tagline: "Precision cultivation management — design a nutrient feed program, then track every crop day-by-day against the plan.",
    summary:
      "Steamhouse is a multi-tenant platform for commercial growing operations — the system of record that replaces the spreadsheets, paper logs, and tribal knowledge most grows still run on. Teams author reusable week-by-week feed schedules (nutrient doses and target water chemistry per growth stage), attach them to a crop, then log a rich daily journal — actual pH/EC/PPM readings, feedings, climate, deviations, and photos — so the whole team works a successful grow off one source of truth. A chemistry engine even reverse-engineers a fertilizer's compound makeup from its label. It runs as a live, one-click demo seeded with a full operation's worth of data, so you can explore the whole app with zero setup.",
    category: "AgTech · Platform",
    role: "Full-stack",
    period: "2025 – now",
    frame: "browser",
    links: {
      live: "https://steamhouse.vercel.app/",
    },
    cover: { src: "/projects/steamhouse/cover.jpg", alt: "Steamhouse — precision cultivation management platform landing page", width: 1600, height: 1000 },
    screenshots: [],
    tour: [
      {
        title: "Crops",
        blurb:
          "Every active crop on one board — strain, growth stage, and start date — each opening a day-by-day journal of the readings, feedings, and climate logged against its prescribed plan.",
        views: [
          { src: "/projects/steamhouse/tour/crops-1-board.png", alt: "Steamhouse — My Crops board: active crops with growth-stage tags and a Journal button on each", width: 2000, height: 1117, caption: "Crop board" },
          { src: "/projects/steamhouse/tour/crops-2-journal.png", alt: "Steamhouse — a crop's daily journal: per-day water source, climate, and pH/EC/PPM target-vs-recorded entries", width: 2000, height: 1116, caption: "Daily journal" },
          { src: "/projects/steamhouse/tour/crops-3-new.png", alt: "Steamhouse — Start New Crop: name it, attach a feed schedule, set a start date, water source, and calendar color", width: 2000, height: 1117, caption: "Start a crop" },
        ],
      },
      {
        title: "Feed Schedules",
        blurb:
          "Reusable week-by-week feed programs: nutrient products and doses with target pH/EC/PPM per growth stage, charted across the grow — built in a guided multi-step editor, with commercial brand schedules to pull from.",
        views: [
          { src: "/projects/steamhouse/tour/sched-1-list.png", alt: "Steamhouse — Feeding Schedules list, each a reusable feed program for a crop type", width: 2000, height: 1115, caption: "My schedules" },
          { src: "/projects/steamhouse/tour/sched-2-recipe.png", alt: "Steamhouse — a schedule's week-by-week recipe: products and doses per growth stage, target pH/EC/PPM, and a nutrient-curve chart", width: 2000, height: 1038, caption: "Week-by-week recipe" },
          { src: "/projects/steamhouse/tour/sched-3-builder.png", alt: "Steamhouse — the multi-step schedule builder: pick products, set per-week amounts, and review across stages", width: 2000, height: 934, caption: "Schedule builder" },
        ],
      },
      {
        title: "Calendar",
        blurb:
          "Every crop's recurring cultivation tasks on one team calendar, color-coded by growth stage — switch between month and week views, assign and complete tasks, and track what's due, overdue, and done.",
        views: [
          { src: "/projects/steamhouse/tour/cal-1-month.png", alt: "Steamhouse — team calendar (month view): recurring tasks across every crop, color-coded by stage, beside a My Tasks panel", width: 2000, height: 1118, caption: "Month view" },
          { src: "/projects/steamhouse/tour/cal-2-week.png", alt: "Steamhouse — calendar week view with per-day task lists and completion checkmarks", width: 2000, height: 1003, caption: "Week view" },
          { src: "/projects/steamhouse/tour/cal-3-task.png", alt: "Steamhouse — Add Task: tie a task to a crop, set a date, recurrence, and assignee", width: 2000, height: 1116, caption: "Add a task" },
        ],
      },
      {
        title: "Products",
        blurb:
          "A searchable nutrient catalog; each product's guaranteed-analysis breakdown feeds the linear-algebra chemistry engine — and any two products can be compared side-by-side by nutrient mass percent.",
        views: [
          { src: "/projects/steamhouse/tour/prod-1-catalog.png", alt: "Steamhouse — product and nutrient catalog filterable by company and category", width: 2000, height: 1000, caption: "Catalog" },
          { src: "/projects/steamhouse/tour/prod-2-compare.png", alt: "Steamhouse — Compare Products: two products' nutrient mass-percent breakdowns charted side by side", width: 2000, height: 997, caption: "Compare products" },
        ],
      },
      {
        title: "Profile & Admin",
        blurb:
          "Account and team administration: personal details and saved water sources, role-based team membership (owner / team-lead / worker), a full team activity audit log, billing — plus an admin panel for managing teams across the operation.",
        views: [
          { src: "/projects/steamhouse/tour/admin-1-account.png", alt: "Steamhouse — My Account: personal details and saved water sources with per-source pH/PPM", width: 2000, height: 1117, caption: "Account" },
          { src: "/projects/steamhouse/tour/admin-2-team.png", alt: "Steamhouse — My Team: team members with role-based permissions (owner, team-lead, worker)", width: 2000, height: 1113, caption: "Team & roles" },
          { src: "/projects/steamhouse/tour/admin-3-activity.png", alt: "Steamhouse — Team Activity: an audit log of who did what across crops, tasks, posts, and files", width: 2000, height: 1116, caption: "Activity log" },
          { src: "/projects/steamhouse/tour/admin-4-billing.png", alt: "Steamhouse — Billing: current plan, subscription summary, and saved payment method", width: 2000, height: 1116, caption: "Billing" },
          { src: "/projects/steamhouse/tour/admin-5-teams.png", alt: "Steamhouse — Admin panel: manage teams across the operation, toggle active state, and seed data", width: 2000, height: 1115, caption: "Admin panel" },
        ],
      },
    ],
    problem: [
      "Serious indoor and hydroponic cultivation is a data-heavy discipline. Growers dose precise nutrient mixes that change every week as a plant moves through its stages, hit exact water-chemistry targets (pH, EC, PPM), log climate and feeding data daily, and coordinate a team across recurring tasks.",
      "In practice this lives in fragmented spreadsheets, paper logs, and tribal knowledge — which makes it error-prone, hard to repeat a grow that actually worked, and impossible to audit. There was no single place to design a feed program, run a crop against it, and see the whole team's work in one timeline.",
    ],
    whatIBuilt: [
      "A full-stack, multi-tenant web app that centralizes the entire crop lifecycle. Teams (with role-based permissions) build reusable feed-schedule templates — week-by-week recipes specifying nutrient products, doses, water volume, and target pH/EC/PPM per growth stage — or pull in commercial schedules published by nutrient companies.",
      "Each crop follows a schedule from a start date, and growers keep a rich daily journal: actual readings, whether plants were fed, deviations from the plan, climate data, and photo/document posts. A FullCalendar-based task system with recurrence rules keeps the team coordinated, and an activity feed tracks who did what.",
      "The standout feature is a chemistry engine that reverse-engineers a fertilizer's makeup from its label — given the guaranteed nutrient percentages and derived compounds, it solves a linear system (Ax = b) for the underlying compound fractions, turning a bag label into actionable per-compound chemistry growers can dose against.",
    ],
    architecture: [
      "It's a Next.js full-stack monolith — a React/MUI single-page app over serverless API routes backed by MongoDB on Vercel. Authorization is enforced at the route level: every API handler is wrapped by an authorizePrivate / authorizeAdmin higher-order function that validates the NextAuth session, lazily provisions the user, and checks team membership plus role-based permissions on every write.",
      "Multi-tenancy runs through Teams: nearly every record is an OwnedObject scoped to a teamId (indexed on teamId), and the teamId on each request is verified against the caller's actual team to prevent cross-tenant access. Mongoose schemas and TypeScript interfaces are defined together per collection, guarded around mongoose.models[...] to survive serverless re-instantiation.",
      "The chemistry solver uses mathjs's lusolve over a per-compound element-composition matrix, and even handles under-determined labels by intelligently injecting ammonium nitrate. Crop photos and documents upload to AWS S3 via presigned URLs, and a Vercel cron refreshes the demo dataset daily so reviewers always land on a populated operation.",
    ],
    stack: [
      "TypeScript",
      "Next.js",
      "React",
      "MUI",
      "MongoDB",
      "Mongoose",
      "NextAuth",
      "AWS S3",
      "mathjs",
      "FullCalendar",
    ],
    outcomes: [
      "Designed a secure multi-tenant data model with route-level RBAC enforced on every mutation, so each growing operation's data is cleanly isolated yet shareable within its team.",
      "Built a genuinely novel domain feature — a linear-algebra fertilizer-composition solver — that goes well beyond CRUD and encodes real agronomy and chemistry.",
      "Shipped 10+ cohesive feature areas (crops, schedules, products, calendar, teams, journal, admin) and a zero-setup portfolio demo: Dockerized MongoDB, a guarded daily-refreshed seed, one-click demo sign-in, and an onboarding modal.",
    ],
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
