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
