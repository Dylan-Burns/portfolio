import { tokenize } from "./text";

/**
 * Trigger phrase -> project slug. A phrase matches when all of its tokens appear in the question.
 * Names, slugs and domains first, then topical aliases. Extended during retrieval tuning.
 */
const PROJECT_ALIASES: Record<string, string[]> = {
  // "medical" and "clinic" also occur in Outpost's text, so they expand (SYNONYMS) rather than detect.
  parahealth: [
    "parahealth", "parahealth.ai", "prior authorization", "prior auth", "healthcare", "pharmacy", "prescription",
    "payer", "patient",
  ],
  // "alert" is too generic (Syene has an alerts room; markup like alert(1)).
  watchtower: ["watchtower", "incident", "outage", "oncall", "monitoring"],
  remoteretros: ["remoteretros", "remoteretros.org", "remote retro", "retro", "retrospective", "agile", "scrum", "sprint"],
  outpost: ["outpost", "projectoutpost", "projectoutpost.org", "offline", "survival", "wikipedia", "kiwix"],
  syene: ["syene", "syene.ai", "commodity", "commodities", "oil", "satellite", "energy"],
  // "sec" alone misfires ("10 sec"); "filing" already covers SEC filings.
  keel: ["keel", "keeldd", "keeldd.com", "10-k", "filing", "rag"],
  claruss: ["claruss", "claruss.app", "ios", "iphone", "screen time"],
  // "price" alone also detects Cartlords on "what's the price of claruss pro".
  cartlords: ["cartlords", "cartlords.com", "grocery", "cart", "grocery price"],
  // "grow" alone misfires ("how did remote retro grow").
  steamhouse: ["steamhouse", "steamhouse.app", "cultivation", "grower", "crop", "hydroponic", "fertilizer"],
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
  sprint: ["retro", "agile"],
  "look back": ["retro", "retrospective"],
  build: ["built"],
  long: ["month", "week", "day", "minute", "second"],
  value: ["principles"],
  belief: ["principles"],
  believe: ["principles"],
  philosophy: ["principles"],
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

/** Base forms for "-ing" and "-ed" words ("measuring" -> "measur", "measure"), so they meet the corpus's other forms. */
export function baseForms(t: string): string[] {
  const m = /^(.{3,}?)(ing|ed)$/.exec(t);
  return m ? [m[1], m[1] + "e"] : [];
}

export function expandTokens(tokens: string[]): string[] {
  const have = new Set(tokens);
  const out = [...tokens];
  for (const t of tokens) for (const b of baseForms(t)) if (!out.includes(b)) out.push(b);
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

/** Every token the alias and synonym maps know: trigger phrases, project slugs and synonym targets. */
export const ALIAS_VOCABULARY: ReadonlySet<string> = new Set([
  ...projectRules.flatMap((r) => [...r.need, r.slug]),
  ...synonymRules.flatMap((r) => [...r.need, ...r.targets]),
]);
