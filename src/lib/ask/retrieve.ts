import { expandTokens } from "./aliases";
import { tokenize } from "./text";
import type { Chunk, Corpus } from "./types";

export const TOP_K = 8;
export const PER_PROJECT_QUOTA = 4;
export const SCORE_FLOOR = 1.0;
export const CONTEXT_CHAR_BUDGET = 6000;

const K1 = 1.2;
const B = 0.75;
const CARD_BOOST = 1.5;

export type Hit = { chunk: Chunk; score: number };

type Stats = { tfs: Map<string, number>[]; lens: number[]; df: Map<string, number>; avgLen: number };

const statsByHash = new Map<string, Stats>();

/**
 * The words a chunk is indexed under: its text plus its section name, so "what are his principles"
 * or "what problem does keel solve" can reach chunks that never use the word. Cards are left out:
 * "card" is not something a visitor asks about.
 */
function indexTokens(c: Chunk): string[] {
  return tokenize(c.section === "card" ? c.text : `${c.text} ${c.section}`);
}

/** Sections every named project always contributes, in priority order. */
const ALWAYS_FOR_NAMED = ["card", "summary"];

function statsFor(corpus: Corpus): Stats {
  const cached = statsByHash.get(corpus.hash);
  if (cached) return cached;
  const tfs: Map<string, number>[] = [];
  const lens: number[] = [];
  const df = new Map<string, number>();
  for (const c of corpus.chunks) {
    const tokens = indexTokens(c);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    tfs.push(tf);
    lens.push(tokens.length);
  }
  const avgLen = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
  const stats = { tfs, lens, df, avgLen };
  statsByHash.set(corpus.hash, stats);
  return stats;
}

function byScore(a: Hit, b: Hit): number {
  return b.score - a.score || (a.chunk.id < b.chunk.id ? -1 : a.chunk.id > b.chunk.id ? 1 : 0);
}

export function retrieve(q: string, corpus: Corpus, projects: string[]): { hits: Hit[]; best: number } {
  const stats = statsFor(corpus);
  const terms = [...new Set(expandTokens(tokenize(q)))];
  const n = corpus.chunks.length;
  const scope = new Set(projects);

  const scored: Hit[] = [];
  corpus.chunks.forEach((chunk, i) => {
    if (scope.size > 0 && !scope.has(chunk.project)) return;
    const tf = stats.tfs[i];
    let score = 0;
    for (const t of terms) {
      const f = tf.get(t);
      if (!f) continue;
      const d = stats.df.get(t) ?? 0;
      const idf = Math.log(1 + (n - d + 0.5) / (d + 0.5));
      score += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * stats.lens[i]) / stats.avgLen));
    }
    if (score > 0) scored.push({ chunk, score: chunk.section === "card" ? score * CARD_BOOST : score });
  });
  scored.sort(byScore);

  const best = scored[0]?.score ?? 0;
  const scoreOf = new Map(scored.map((h) => [h.chunk.id, h.score]));

  // A named project always brings its card and summary, even when the question shares few words
  // with them ("what is parahealth"). Cards of every named project come before any summary.
  const pinned: Hit[] = [];
  for (const section of ALWAYS_FOR_NAMED)
    for (const chunk of corpus.chunks)
      if (scope.has(chunk.project) && chunk.section === section && pinned.length < TOP_K)
        pinned.push({ chunk, score: scoreOf.get(chunk.id) ?? 0 });
  const pinnedIds = new Set(pinned.map((h) => h.chunk.id));

  const hits: Hit[] = [...pinned];
  const taken = new Map<string, number>();
  for (const h of pinned) taken.set(h.chunk.project, (taken.get(h.chunk.project) ?? 0) + 1);
  const rest = scored.filter((h) => !pinnedIds.has(h.chunk.id));
  const take = (h: Hit) => {
    taken.set(h.chunk.project, (taken.get(h.chunk.project) ?? 0) + 1);
    hits.push(h);
  };

  if (scope.size === 0) {
    for (const h of rest) {
      if (hits.length >= TOP_K) break;
      if ((taken.get(h.chunk.project) ?? 0) < PER_PROJECT_QUOTA) take(h);
    }
  } else {
    // Each named project gets a fair share (at least one slot); leftover slots go by score.
    const share = Math.max(1, Math.floor(TOP_K / scope.size));
    const chosen = new Set<string>();
    for (const h of rest) {
      if (hits.length >= TOP_K) break;
      if ((taken.get(h.chunk.project) ?? 0) < share) {
        take(h);
        chosen.add(h.chunk.id);
      }
    }
    for (const h of rest) {
      if (hits.length >= TOP_K) break;
      if (!chosen.has(h.chunk.id)) take(h);
    }
  }
  hits.sort(byScore);

  // Over the budget, drop the weakest passages first, pinned ones last.
  let total = hits.reduce((s, h) => s + h.chunk.text.length, 0);
  while (total > CONTEXT_CHAR_BUDGET) {
    let i = hits.length - 1;
    while (i >= 0 && pinnedIds.has(hits[i].chunk.id)) i--;
    if (i < 0) i = hits.length - 1;
    if (i < 0) break;
    total -= hits.splice(i, 1)[0].chunk.text.length;
  }
  return { hits, best };
}
