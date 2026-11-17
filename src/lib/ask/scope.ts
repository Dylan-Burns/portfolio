import { ALIAS_VOCABULARY, baseForms } from "./aliases";
import { PERSON_BEHIND, tokenize } from "./text";
import type { Corpus } from "./types";
import { COMMON_WORDS } from "./validate";

/**
 * Words that say what kind of answer is wanted, not what it is about, plus contraction fragments
 * ("what's" -> "s") and quantity words ("how many", "how much").
 */
const GENERIC = new Set(
  tokenize("explain describe tell show list compare summarize summarise give about kind type thing stuff s t many much help"),
);

/**
 * Common English and conversational filler: never evidence of an off-topic question. A common word
 * that is also in the corpus still counts as known; one that is not is simply ignored.
 */
const FILLER =
  "u ur pls plz please hey hi hello yo thanks thank thx ok okay cool nice great awesome wow lol guy guys person " +
  "people friend buddy man quick quickly rundown overview brief short honestly honest really actually basically " +
  "kinda sorta gonna wanna gotta gimme impressive interesting curious wondering wonder best favorite favourite " +
  "behind here there anyway also just like know want wanted would could should maybe bit lot lots different jump";
const COMMON = new Set(tokenize(`${COMMON_WORDS.join(" ")} ${FILLER}`));

/** Mentions of the owner or the portfolio itself. */
const ANCHORS = new Set(
  tokenize("dylan burn burns he his him himself portfolio project work built build stack principle site"),
);
/** "here" ("the most impressive thing here") is a stopword to tokenize, so it is matched as text. */
const HERE = /\bhere\b/;

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
 * in the alias maps, or an anchor; it is unknown when it is none of those and not common English
 * (COMMON); common words outside the corpus are ignored. With K known and U unknown words:
 *
 * Lenient, when a project is named or the question is anchored (Dylan, the portfolio, "here",
 * "the guy behind this"): out of scope only when U >= 2 and U > K.
 *
 * Otherwise out of scope when any holds:
 *   1. U >= 2;
 *   2. U >= 1 and K <= 1;
 *   3. there are no content words;
 *   4. K <= 2.
 */
export function inScope(q: string, projects: string[], corpus: Corpus): boolean {
  const vocab = vocabularyOf(corpus);
  const isKnown = (t: string) =>
    ANCHORS.has(t) || ALIAS_VOCABULARY.has(t) || vocab.has(t) || baseForms(t).some((b) => vocab.has(b));
  const content = [...new Set(tokenize(q))].filter((t) => !GENERIC.has(t));
  const known = content.filter(isKnown).length;
  const unknown = content.filter((t) => !isKnown(t) && !COMMON.has(t)).length;
  const lenient = projects.length > 0 || content.some((t) => ANCHORS.has(t)) || PERSON_BEHIND.test(q.toLowerCase()) || HERE.test(q.toLowerCase());

  if (lenient) return !(unknown >= 2 && unknown > known);
  if (unknown >= 2) return false;
  if (unknown >= 1 && known <= 1) return false;
  if (content.length === 0) return false;
  return known > 2;
}
