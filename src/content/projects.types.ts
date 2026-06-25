export type ProjectCategory =
  | "Healthcare · AI"
  | "AgTech · Platform"
  | "Wellness · iOS"
  | "Commerce · Web"
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
  /** Technical docs / "learn more" page, rendered as a "Read the docs" button. */
  docs?: string;
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
  /** Optional short label for a single view inside a feature tour (e.g. "Journal"). */
  caption?: string;
}

/** One tab in a feature tour — a core feature, plus the views you swipe through for it. */
export interface TourFeature {
  /** Tab label, e.g. "Crops". */
  title: string;
  /** One–two sentence overview of the feature, shown under the window. */
  blurb: string;
  /** The views shown in the single window for this feature (>= 1). */
  views: ProjectImage[];
}

export interface ProjectVideo {
  /** Path under /public (mp4/webm) for a self-hosted clip. Mutually exclusive with `embed`. */
  src?: string;
  /** Embed URL (e.g. a Loom share) — rendered as an iframe instead of a self-hosted <video>. */
  embed?: string;
  /** Path under /public — poster frame for a self-hosted `src` clip (ignored for embeds). */
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
  /**
   * Optional feature tour — a single browser window with one tab per core feature;
   * each tab swaps a set of views through that window. When present, it replaces the
   * stacked `screenshots` list on the detail page.
   */
  tour?: TourFeature[];
  /** Optional looping muted clip. */
  video?: ProjectVideo;
  /** Optional clickable marketing-site preview, shown in a browser window above/below the lead video. */
  marketingSite?: { image: ProjectImage; href: string };
  /** Paragraphs, plain text. */
  problem: string[];
  /** Paragraphs, plain text. */
  whatIBuilt: string[];
  /** Optional high-level architecture / "how it works" paragraphs. Section hidden when omitted. */
  architecture?: string[];
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
