import { ALIAS_VOCABULARY, baseForms } from "./aliases";
import { tokenize } from "./text";
import type { Corpus } from "./types";

/**
 * Words that say what kind of answer is wanted, not what it is about, plus contraction fragments
 * ("what's" -> "s") and quantity words ("how many", "how much").
 */
const GENERIC = new Set(
  tokenize("explain describe tell show list compare summarize summarise give about kind type thing stuff s t many much help"),
);

/** Mentions of the owner or the portfolio itself. */
const ANCHORS = new Set(
  tokenize("dylan burn burns he his him portfolio project work built build stack principle site"),
);

let memo: { hash: string; vocab: Set<string> } | undefined;

function vocabularyOf(corpus: Corpus): Set<string> {
  if (memo?.hash !== corpus.hash) {
    memo = { hash: corpus.hash, vocab: new Set(corpus.chunks.flatMap((c) => tokenize(c.text))) };
  }
  return memo.vocab;
}

/**
 * Is the question made of words this portfolio knows? Content words are the question's tokens minus
 * GENERIC. A word is known when it is in the corpus text (directly or via its -ing/-ed base form),
 * in the alias maps, or an anchor. With K known and U unknown content words, out of scope when:
 *   1. U >= 2, unless a project is named and K > U;
 *   2. U >= 1 and K <= 1 and no project is named;
 *   3. there are no content words and no project is named;
 *   4. no project is named, no anchor is present, and K <= 2.
 */
export function inScope(q: string, projects: string[], corpus: Corpus): boolean {
  const vocab = vocabularyOf(corpus);
  const isKnown = (t: string) =>
    ANCHORS.has(t) || ALIAS_VOCABULARY.has(t) || vocab.has(t) || baseForms(t).some((b) => vocab.has(b));
  const content = [...new Set(tokenize(q))].filter((t) => !GENERIC.has(t));
  const named = projects.length > 0;
  const anchored = content.some((t) => ANCHORS.has(t));
  const unknown = content.filter((t) => !isKnown(t)).length;
  const known = content.length - unknown;

  if (unknown >= 2 && !(named && known > unknown)) return false;
  if (unknown >= 1 && known <= 1 && !named) return false;
  if (content.length === 0 && !named) return false;
  if (!named && !anchored && known <= 2) return false;
  return true;
}
