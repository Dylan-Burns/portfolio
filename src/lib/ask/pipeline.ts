import { buildCorpus } from "./corpus";
import { classify, REPLIES } from "./intent";
import type { AnswerProvider } from "./provider";
import { retrieve, SCORE_FLOOR } from "./retrieve";
import { sanitizeQuestion, stripInvisible } from "./text";
import { MODEL_ID, PROMPT_VERSION } from "./types";
import type { AskReply, Chunk, Corpus, ModelAnswer, Source } from "./types";
import { ANSWER_MAX_CHARS, validateAnswer } from "./validate";

export type AskDeps = {
  provider: AnswerProvider;
  corpus?: Corpus;
  cache?: Map<string, AskReply>;
  enabled?: boolean;
};

const CACHE_MAX = 500;

const reply = (kind: AskReply["kind"], text: string, sources: Source[] = []): AskReply => ({ kind, text, sources });

/** De-duplicated by file + section, in the order given. */
export function sourcesFor(chunks: Chunk[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const c of chunks) {
    const key = `${c.file}\u0000${c.section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.slug === undefined ? { file: c.file, section: c.section } : { file: c.file, section: c.section, slug: c.slug });
  }
  return out;
}

/** Cut at the last sentence end that fits; fall back to the last word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = [...head.matchAll(/[.!?](?=\s|$)/g)].pop();
  if (sentence?.index !== undefined && sentence.index > max / 3) return head.slice(0, sentence.index + 1);
  const space = head.lastIndexOf(" ");
  return (space > 0 ? head.slice(0, space) : head).replace(/[\s,;:]+$/, "") + ".";
}

function copyOf(r: AskReply): AskReply {
  return { kind: r.kind, text: r.text, sources: r.sources.map((s) => ({ ...s })) };
}

function remember(cache: Map<string, AskReply> | undefined, key: string, r: AskReply): void {
  if (!cache) return;
  cache.set(key, copyOf(r));
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

async function run(raw: unknown, deps: AskDeps): Promise<AskReply> {
  const clean = sanitizeQuestion(raw);
  if (!clean.ok) return reply("refuse", REPLIES.refuse);

  const intent = classify(clean.q);
  if (intent.kind === "deflect") return reply("deflect", REPLIES.deflect);
  if (intent.kind === "meta") return reply("meta", REPLIES.meta);
  if (intent.kind === "refuse") return reply("refuse", REPLIES.refuse);

  const corpus = deps.corpus ?? buildCorpus();
  const key = `${clean.q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()}|${corpus.hash}|${PROMPT_VERSION}|${MODEL_ID}`;
  const cached = deps.cache?.get(key);
  if (cached) return copyOf(cached);

  const { hits, best } = retrieve(clean.q, corpus, intent.projects);
  if (hits.length === 0 || best < SCORE_FLOOR) return reply("refuse", REPLIES.notFound);

  const chunks = hits.map((h) => h.chunk);
  // Square brackets could imitate a "[id] text" passage line.
  const question = clean.q.replace(/\[/g, "(").replace(/\]/g, ")");

  let answer: ModelAnswer;
  try {
    answer = await deps.provider.generate({ question, chunks });
  } catch {
    return reply("busy", REPLIES.busy);
  }

  let verdict: ReturnType<typeof validateAnswer>;
  try {
    verdict = validateAnswer(answer, chunks);
  } catch {
    verdict = { ok: false, reason: "no_citation" };
  }

  let result: AskReply;
  if (verdict.ok) {
    const byId = new Map(chunks.map((c) => [c.id, c]));
    const cited = answer.citations.map((id) => byId.get(id)).filter((c): c is Chunk => !!c);
    result = reply("answer", stripInvisible(answer.answer.normalize("NFKC")).trim(), sourcesFor(cited));
  } else if (verdict.reason === "unanswerable" && answer?.answerable === false) {
    return reply("refuse", REPLIES.notFound);
  } else {
    const top = chunks[0];
    result = reply("answer", truncate(`From ${top.file}: ${top.text}`, ANSWER_MAX_CHARS), sourcesFor([top]));
  }
  remember(deps.cache, key, result);
  return result;
}

export async function answerQuestion(raw: unknown, deps: AskDeps): Promise<AskReply> {
  try {
    if (deps.enabled === false) return reply("off", REPLIES.off);
    return await run(raw, deps);
  } catch {
    return reply("busy", REPLIES.busy);
  }
}
