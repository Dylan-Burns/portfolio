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

function statsFor(corpus: Corpus): Stats {
  const cached = statsByHash.get(corpus.hash);
  if (cached) return cached;
  const tfs: Map<string, number>[] = [];
  const lens: number[] = [];
  const df = new Map<string, number>();
  for (const c of corpus.chunks) {
    const tokens = tokenize(c.text);
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
  scored.sort((a, b) => b.score - a.score || (a.chunk.id < b.chunk.id ? -1 : a.chunk.id > b.chunk.id ? 1 : 0));

  const best = scored[0]?.score ?? 0;
  const perProject = scope.size >= 2 ? Math.floor(TOP_K / scope.size) : scope.size === 1 ? TOP_K : PER_PROJECT_QUOTA;
  const taken = new Map<string, number>();
  const hits: Hit[] = [];
  for (const h of scored) {
    if (hits.length >= TOP_K) break;
    const c = taken.get(h.chunk.project) ?? 0;
    if (c >= perProject) continue;
    taken.set(h.chunk.project, c + 1);
    hits.push(h);
  }

  let total = hits.reduce((s, h) => s + h.chunk.text.length, 0);
  while (hits.length > 0 && total > CONTEXT_CHAR_BUDGET) total -= hits.pop()!.chunk.text.length;
  return { hits, best };
}
