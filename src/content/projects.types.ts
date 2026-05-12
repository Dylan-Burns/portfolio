export type ProjectCategory =
  | "Healthcare · AI"
  | "iOS · Consumer"
  | "Web · Personal"
  | "Web · Side project";

export interface ProjectLinks {
  /** Primary off-site target — the app, or the project's main public site. */
  live?: string;
  /** The product/platform app, when `live` points at a separate marketing site (e.g. Parahealth). */
  app?: string;
  /** iOS App Store URL. */
  appStore?: string;
  /** Public source repository, if any. */
  source?: string;
  /** Optional interactive/sandbox demo (e.g. Parahealth, added later). */
  demo?: string;
}

export interface ProjectImage {
  /** Path under /public. */
  src: string;
  /** Non-empty alt text. */
  alt: string;
  /** Intrinsic width in px (> 0). */
  width: number;
  /** Intrinsic height in px (> 0). */
  height: number;
}

export interface ProjectVideo {
  /** Path under /public (mp4/webm). */
  src: string;
  /** Path under /public. */
  poster?: string;
}

export interface Project {
  /** Unique, url-safe slug. */
  slug: string;
  name: string;
  /** One line — used on the card. */
  tagline: string;
  /** 1–3 sentences — used in the detail hero. */
  summary: string;
  category: ProjectCategory;
  /** e.g. "Founder", "Builder". */
  role: string;
  /** e.g. "2024 – now". */
  period: string;
  /** How gallery images are framed on the detail page. */
  frame: "browser" | "phone";
  links: ProjectLinks;
  /** Card image + detail hero background. */
  cover: ProjectImage;
  /** Gallery (>= 1). */
  screenshots: ProjectImage[];
  /** Optional looping muted clip. */
  video?: ProjectVideo;
  /** Paragraphs, plain text. */
  problem: string[];
  /** Paragraphs, plain text. */
  whatIBuilt: string[];
  /** Tech chips (>= 1). */
  stack: string[];
  /** Bullets (>= 1). */
  outcomes: string[];
}

export interface SiteConfig {
  name: string;
  /** Short role line, e.g. "Builder & Founder". */
  role: string;
  /** Canonical site URL. */
  url: string;
  email: string;
  /** Path under /public, e.g. "/dylan-burns-resume.pdf". */
  resumePath: string;
  socials: { label: string; href: string }[];
  /** About-section content. */
  about: { portrait: ProjectImage; bio: string[]; tools: string[]; now: string };
}
