import { tokenize } from "./text";

/**
 * Trigger phrase -> project slug. A phrase matches when all of its tokens appear in the question.
 * Names, slugs and domains first, then topical aliases. Extended during retrieval tuning.
 */
const PROJECT_ALIASES: Record<string, string[]> = {
  parahealth: [
    "parahealth", "prior authorization", "prior auth", "healthcare", "pharmacy", "prescription",
    "payer", "medical", "clinic", "patient",
  ],
  watchtower: ["watchtower", "incident", "outage", "on-call", "oncall", "monitoring", "alert"],
  remoteretros: ["remoteretros", "remote retro", "retro", "retrospective", "agile", "scrum"],
  outpost: ["outpost", "projectoutpost", "offline", "survival", "wikipedia", "kiwix"],
  syene: ["syene", "commodity", "oil", "satellite", "energy"],
  keel: ["keel", "keeldd", "sec", "10-k", "filing", "rag"],
  claruss: ["claruss", "ios", "iphone", "screen time"],
  cartlords: ["cartlords", "grocery", "cart", "price"],
  steamhouse: ["steamhouse", "cultivation", "grow", "crop"],
};

/** Trigger phrase -> words that actually occur in src/content/projects.ts. */
const SYNONYMS: Record<string, string[]> = {
  medical: ["healthcare"],
  health: ["healthcare"],
  pharmacy: ["healthcare", "prescription"],
  prescription: ["authorization"],
  paperwork: ["authorization"],
  insurance: ["payer", "authorization"],
  insurer: ["payer", "authorization"],
  incident: ["investigation"],
  outage: ["incident", "investigation"],
  "on-call": ["incident", "alert"],
  oncall: ["incident", "alert"],
  monitoring: ["alert", "incident"],
  retrospective: ["retro"],
  agile: ["retro", "team"],
  scrum: ["retro", "agile"],
  survival: ["offline"],
  wikipedia: ["offline", "kiwix"],
  oil: ["commodity", "energy"],
  commodity: ["market", "energy"],
  satellite: ["energy", "commodity"],
  "10-k": ["filing", "sec"],
  filings: ["filing", "sec"],
  rag: ["retrieval"],
  iphone: ["ios"],
  "screen time": ["ios", "screen"],
  groceries: ["grocery"],
  cart: ["grocery", "price"],
  cultivation: ["grow", "crop"],
  grow: ["cultivation", "crop"],
  crops: ["crop"],
  plants: ["plant", "crop"],
};

type Rule = { need: string[]; targets: string[] };

const projectRules = Object.entries(PROJECT_ALIASES).flatMap(([slug, phrases]) =>
  phrases.map((p) => ({ need: tokenize(p), slug })),
);

const synonymRules: Rule[] = Object.entries(SYNONYMS).map(([phrase, targets]) => ({
  need: tokenize(phrase),
  targets: targets.flatMap((t) => tokenize(t)),
}));

function matches(have: Set<string>, need: string[]): boolean {
  return need.length > 0 && need.every((t) => have.has(t));
}

export function expandTokens(tokens: string[]): string[] {
  const have = new Set(tokens);
  const out = [...tokens];
  for (const r of synonymRules) {
    if (!matches(have, r.need)) continue;
    for (const t of r.targets) if (!out.includes(t)) out.push(t);
  }
  return out;
}

export function detectProjects(q: string): string[] {
  const have = new Set(tokenize(q));
  const found = new Set<string>();
  for (const r of projectRules) if (matches(have, r.need)) found.add(r.slug);
  return [...found].sort();
}
