import { createHash } from "node:crypto";
import { projects } from "@/content/projects";
import type { Project } from "@/content/projects.types";
import { profile } from "@/content/profile";
import type { Chunk, Corpus } from "./types";

/** Terminal file labels, identical to LABEL in public/burnsos.html. */
const LABEL: Record<string, string> = {
  parahealth: "parahealth.ai",
  watchtower: "watchtower",
  remoteretros: "remoteretros.org",
  outpost: "projectoutpost.org",
  syene: "syene.ai",
  keel: "keeldd.com",
  claruss: "claruss.app",
  cartlords: "cartlords.com",
  steamhouse: "steamhouse.app",
};

/** Role and period are unconfirmed for these projects, so the card omits them. */
const HELD_OUT = new Set(["remoteretros", "syene", "keel"]);

const LINK_LABELS: [keyof Project["links"], string][] = [
  ["live", "live site"],
  ["app", "app"],
  ["appStore", "App Store"],
  ["source", "source code"],
  ["docs", "docs"],
  ["demo", "demo"],
];

function card(p: Project): string {
  const parts = [`${p.name} (${p.category}): ${p.tagline}`];
  if (!HELD_OUT.has(p.slug)) parts.push(`Role: ${p.role}, ${p.period}.`);
  parts.push(`Stack: ${p.stack.join(", ")}.`);
  const links = LINK_LABELS.filter(([k]) => p.links[k]).map(([, label]) => label);
  if (links.length) parts.push(`Links: ${links.join(", ")}.`);
  return parts.join(" ");
}

function projectChunks(p: Project): Chunk[] {
  const file = LABEL[p.slug] ?? p.slug;
  const out: Chunk[] = [];
  const add = (section: string, texts: string[]) =>
    texts.forEach((text, i) =>
      out.push({ id: `${p.slug}/${section}/${i + 1}`, project: p.slug, section, file, slug: p.slug, text }),
    );
  add("card", [card(p)]);
  add("summary", [p.summary]);
  add("problem", p.problem);
  add("built", p.whatIBuilt);
  add("architecture", p.architecture ?? []);
  add("outcomes", p.outcomes);
  return out;
}

function profileChunks(): Chunk[] {
  const chunk = (section: string, file: string, i: number, text: string): Chunk => ({
    id: `profile/${section}/${i + 1}`,
    project: "profile",
    section,
    file,
    text,
  });
  return [
    ...profile.about.map((t, i) => chunk("about", "about.txt", i, t)),
    ...profile.principles.map((x, i) => chunk("principles", "principles.txt", i, `${x.title}. ${x.body}`)),
  ];
}

export function buildCorpus(): Corpus {
  const chunks = [...projects.flatMap(projectChunks), ...profileChunks()];
  const hash = createHash("sha256")
    .update(chunks.map((c) => `${c.id}\n${c.text}`).join("\n\n"))
    .digest("hex");
  return { chunks, hash };
}

/**
 * Domain-shaped text, the same shape the answer validator rejects as a bare link: a dotted name whose
 * last part is two or more letters, all lower or all upper case, and not a code-file extension
 * ("projectoutpost.org", "mongoose.models"; not "Next.js").
 */
const CODE_EXT = "js|ts|jsx|tsx|mjs|cjs|json|md|py|css|png|jpg|jpeg|gif|svg|webp|pdf|txt|html|csv";
const DOMAIN_SHAPED = new RegExp(
  String.raw`\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?!(?:${CODE_EXT})\b)(?:[a-z]{2,}|[A-Z]{2,})\b`,
);

export function hasDomainShape(text: string): boolean {
  return DOMAIN_SHAPED.test(text);
}

const NAME = new Map(projects.map((p) => [p.slug, p.name]));

/** The display name of the project a chunk belongs to ("Claruss"), or undefined for the profile. */
export function projectName(c: Chunk): string | undefined {
  return c.project === "profile" ? undefined : NAME.get(c.project);
}

/** A chunk's page in plain words ("the Outpost page", "the about page"), never a domain-shaped label. */
export function pageName(c: Chunk): string {
  return `the ${c.project === "profile" ? c.section : (NAME.get(c.project) ?? c.project)} page`;
}

