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
    portrait: {
      src: "/about/portrait.svg",
      alt: "Portrait of Dylan Burns",
      width: 1200,
      height: 1500,
    },
    bio: [
      // TODO(owner): real bio
      "I build software products end to end — design, engineering, and the unglamorous bits in between.",
      "Lately that's healthcare automation (Parahealth) and consumer apps (Claruss), with the occasional weekend project.",
    ],
    tools: ["TypeScript", "React / Next.js", "Node", "Swift / SwiftUI", "Postgres", "AI / LLMs", "Vercel"],
    now: "Currently building Parahealth — turning prior authorization from a multi-day slog into minutes.",
  },
};
