// 30 real model answers (claude-haiku-5-5, live eval runs 1, 3 and 5) that the validator passed at 89f2ee6,
// before any word list existed. Sampled at a fixed stride from the 281 distinct passing answers to answerable questions.
export const STILL_PASS: { q: string; answer: string; citations: string[] }[] = [
  {
    "q": "how fast does parahealth produce a prior authorization",
    "answer": "Parahealth generates a completed, payer-ready prior authorization in under five minutes, down from the 15–45 minutes a tech spends today. This result has held across different patient profiles and messy real-world note quality.",
    "citations": [
      "parahealth/outcomes/1",
      "parahealth/summary/1"
    ]
  },
  {
    "q": "what is remoteretros.org built with",
    "answer": "Remote Retro is built on Next.js, with Tailwind CSS v4 and Motion for the marketing surface, and its stack is listed as TypeScript, Next.js, React, Tailwind CSS, Motion, WebSockets, and Vercel.",
    "citations": [
      "remoteretros/built/1",
      "remoteretros/architecture/2",
      "remoteretros/card/1"
    ]
  },
  {
    "q": "how did keel score on its eval gates",
    "answer": "Keel passed all 10 eval gates on its 28-question golden set, with faithfulness at 0.94, citation precision at 1.00, numeric accuracy at 1.00 (9 of 9 gold values), recall at 25 of 0.86, and refusal correctness at 4 of 4 at zero model requests.",
    "citations": [
      "keel/outcomes/1"
    ]
  },
  {
    "q": "how many stores can cartlords split a cart across",
    "answer": "Cartlords can split a cart across one, two, or three stores, computing the best split and the savings versus shopping at a single store.",
    "citations": [
      "cartlords/built/2",
      "cartlords/summary/1"
    ]
  },
  {
    "q": "what water chemistry targets does steamhouse track",
    "answer": "Steamhouse tracks pH, EC, and PPM water-chemistry targets, which growers set per growth stage in their feed schedules and then log as actual readings in their daily journals.",
    "citations": [
      "steamhouse/problem/1",
      "steamhouse/built/1",
      "steamhouse/summary/1"
    ]
  },
  {
    "q": "which projects are open source",
    "answer": "Remote Retro is free and open source, built on Next.js. Outpost is also free and open source, and it runs as an offline library on a spare Mac or Linux computer.",
    "citations": [
      "remoteretros/summary/1",
      "outpost/summary/1"
    ]
  },
  {
    "q": "what did he build for finding cheaper groceries",
    "answer": "Dylan Burns built Cartlords, a web app that compares the total cost of a grocery list across nearby stores using scraped prices. It finds the cheapest way to buy the cart, including splitting it across two or three stores, and shows the savings versus shopping at a single store on a map.",
    "citations": [
      "cartlords/card/1",
      "cartlords/built/1",
      "cartlords/built/2"
    ]
  },
  {
    "q": "what did he make for measuring oil tanks from space",
    "answer": "Dylan built Syene, a commodities intelligence terminal that reads storage-tank fill levels from shadow geometry in satellite scenes, with the nowcast scored against weekly EIA prints. Each signal ships with its public method and the moment its value became knowable.",
    "citations": [
      "syene/card/1",
      "syene/summary/1"
    ]
  },
  {
    "q": "what was his role on steamhouse",
    "answer": "Dylan Burns's role on Steamhouse was Full-stack, covering 2022 to 2023.",
    "citations": [
      "steamhouse/card/1"
    ]
  },
  {
    "q": "what drives him",
    "answer": "He is driven by curiosity and the pull of learning something new, believing that not knowing how to do something is the reason to begin and that finishing turns curiosity into skill. He also wants to be properly good at everything he takes on, and he commits fully to each area until he has built something real in it.",
    "citations": [
      "profile/about/5",
      "profile/about/3",
      "profile/principles/5"
    ]
  },
  {
    "q": "what does a watchtower investigation cost",
    "answer": "Verified prompt caching brings a full multi-step investigation to roughly $0.10–0.40 of API spend, with per-step uncached input measured at ~2 tokens.",
    "citations": [
      "watchtower/outcomes/2",
      "watchtower/architecture/3"
    ]
  },
  {
    "q": "how accurate is syene's satellite storage nowcast",
    "answer": "The satellite storage nowcast, scored walk-forward against EIA prints in the fixture backfill, tracks the reported level at 0.79 correlation with a 1.14 million-barrel mean error. The weekly direction hit rate (0.55) is published beside it.",
    "citations": [
      "syene/outcomes/1"
    ]
  },
  {
    "q": "how much does claruss pro cost",
    "answer": "Claruss is live on the App Store for free, with a Claruss Pro subscription at $4.99/mo or $29.99/yr.",
    "citations": [
      "claruss/outcomes/1"
    ]
  },
  {
    "q": "how does the steamhouse chemistry engine work",
    "answer": "The chemistry engine reverse-engineers a fertilizer's makeup from its label. Given the guaranteed nutrient percentages and derived compounds, it solves a linear system (Ax = b) for the underlying compound fractions. It uses mathjs's lusolve over a per-compound element-composition matrix and injects ammonium nitrate for under-determined labels.",
    "citations": [
      "steamhouse/built/3",
      "steamhouse/architecture/3"
    ]
  },
  {
    "q": "which projects use postgres",
    "answer": "Syene, Claruss and Parahealth all list Postgres in their stacks.",
    "citations": [
      "syene/card/1",
      "claruss/card/1",
      "parahealth/card/1"
    ]
  },
  {
    "q": "which projects did he build solo",
    "answer": "Claruss was designed, built, and shipped solo. Watchtower was designed, built, evaluated, and shipped solo in under a week. Parahealth was built solo.",
    "citations": [
      "claruss/outcomes/2",
      "watchtower/outcomes/4",
      "parahealth/outcomes/3"
    ]
  },
  {
    "q": "does he prefer range or depth",
    "answer": "He has never believed you have to choose between range and depth. He commits completely to each thing he takes on until it works and ships.",
    "citations": [
      "profile/about/2",
      "profile/about/3"
    ]
  },
  {
    "q": "which project helps with insurance paperwork for medicine",
    "answer": "ParaHealth automates prior authorizations for prescription drugs, the paperwork pharmacy techs and clinic staff fight through for every script.",
    "citations": [
      "parahealth/summary/1",
      "parahealth/card/1"
    ]
  },
  {
    "q": "which app stops me doomscrolling on my phone",
    "answer": "Claruss is a screen-time blocker that actually holds the line. It is a native iPhone app built on Apple's Screen Time / Family Controls APIs: pick the apps and Safari sites to block, set a recurring schedule, and let the system enforce it.",
    "citations": [
      "claruss/card/1",
      "claruss/built/1"
    ]
  },
  {
    "q": "which of his projects involve maps",
    "answer": "Outpost is an offline knowledge server that includes maps. Cartlords has a headline feature that plots savings on a map of the stores around you.",
    "citations": [
      "outpost/card/1",
      "cartlords/built/2"
    ]
  },
  {
    "q": "tell me about dylan",
    "answer": "Passionate technologist and explorer. I have never believed you have to choose between range and depth. My interests run so wide: healthcare, fintech, satellite data, infrastructure, agriculture, and software that keeps working when the internet doesn't.",
    "citations": [
      "profile/about/1",
      "profile/about/2",
      "profile/about/4"
    ]
  },
  {
    "q": "why does he jump between so many different industries",
    "answer": "His interests run so wide because he has never believed you have to choose between range and depth. Each field began as one he knew nothing about, and he stayed with each until he had built something real in it.",
    "citations": [
      "profile/about/2",
      "profile/about/4"
    ]
  },
  {
    "q": "how many interviews validated parahealth",
    "answer": "Parahealth was validated through 50+ pharmacist and provider interviews.",
    "citations": [
      "parahealth/outcomes/3",
      "parahealth/problem/2"
    ]
  },
  {
    "q": "how many data connectors does syene have",
    "answer": "Syene's data platform has 15+ connectors, including EIA, FRED, CFTC, Baker Hughes, exchange settles, weather, AIS shipping, IMF PortWatch chokepoint transits, and news.",
    "citations": [
      "syene/built/1"
    ]
  },
  {
    "q": "which projects use postgres",
    "answer": "Syene uses Postgres. Claruss uses Postgres. Parahealth uses Postgres.",
    "citations": [
      "syene/card/1",
      "claruss/card/1",
      "parahealth/card/1"
    ]
  },
  {
    "q": "which projects are open source",
    "answer": "Remote Retro is a free, open-source web app for running agile retrospectives with a distributed team. Outpost is an offline knowledge server, and it is free and open source.",
    "citations": [
      "remoteretros/summary/1",
      "outpost/summary/1"
    ]
  },
  {
    "q": "what did he build for finding cheaper groceries",
    "answer": "Cartlords is a web app where you build a grocery list, set your location and a search radius, and instantly see what that exact list costs at each nearby store, broken down per item, with the cheapest store for every product and the best overall place to shop. Its headline feature is multi-store optimization, which computes the best one-, two-, and three-store splits of your cart.",
    "citations": [
      "cartlords/card/1",
      "cartlords/built/1",
      "cartlords/built/2"
    ]
  },
  {
    "q": "tell me about the fertilizer solver",
    "answer": "The standout feature is a chemistry engine that reverse-engineers a fertilizer's makeup from its label. Given the guaranteed nutrient percentages and derived compounds, it solves a linear system (Ax = b) for the underlying compound fractions, turning a bag label into actionable per-compound chemistry growers can dose against. It uses mathjs's lusolve over a per-compound element-composition matrix, and handles under-determined labels by injecting ammonium nitrate.",
    "citations": [
      "steamhouse/built/3",
      "steamhouse/architecture/3"
    ]
  },
  {
    "q": "what work did he do on parahealth",
    "answer": "Dylan Burns designed and built the whole of Parahealth solo: frontend, backend, and the AI pipeline. He worked as its Founder from 2026 to now. Benefit verification runs as an automated AI phone call that dials the payer and works through their phone tree.",
    "citations": [
      "parahealth/summary/1",
      "parahealth/card/1",
      "parahealth/built/2"
    ]
  },
  {
    "q": "who is dylan burns",
    "answer": "Dylan Burns is a passionate technologist and explorer. He describes himself as someone who commits completely to what he takes on and masters it until it works and ships.",
    "citations": [
      "profile/about/1",
      "profile/about/3"
    ]
  }
];
