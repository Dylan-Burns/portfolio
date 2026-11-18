import { ALIAS_VOCABULARY, baseForms, expandTokens } from "./aliases";
import { projects as caseStudies } from "@/content/projects";
import { PERSON_BEHIND, tokenize } from "./text";
import type { Corpus } from "./types";
import { COMMON_NOT_GROUNDING, COMMON_WORDS } from "./validate";

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
const COMMON = new Set(tokenize(`${COMMON_WORDS.join(" ")} ${COMMON_NOT_GROUNDING.join(" ")} ${FILLER}`));

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

/** A question about the owner as a person: a pronoun, his name, or a role noun for whoever made the site. */
const PERSON_ANCHOR = /\b(he|him|his|himself|he's|dylan|dylans|dylan's|dylan’s|burns)\b|\b(author|owner|creator|builder|developer|dev|guy|person|engineer|designer)('s|’s)?\b/;

/** Introductions, answered from the about text whatever their words. */
const INTRO_SHAPES: RegExp[] = [
  /^(who|what)('s| is| was) (he|dylan|dylan burns|this (guy|person|dev|developer))\s*[?.!]*$/,
  /\btell me (more )?about (him|dylan|dylan burns|the (guy|person|dev|developer|creator|author|owner|builder))\s*[?.!]*$/,
  /^what (does|did) (he|dylan) do\s*[?.!]*$/,
  /\bwhat('s| is) (he|dylan) like\b/,
  /\bwhat (kind|sort|type) of (engineer|developer|dev|builder|person|designer|maker|technologist|programmer|coder|founder) (is|was) (he|dylan)\b/,
  /\b(his|dylan'?s|dylan’s) background\b/,
  /\b(rundown|overview|summary|intro|introduction|bio) (on|of|about) (him|dylan)\b/,
  /\bwhat (he|dylan)('s| is) about\b/,
  /\bwhat (drives|motivates|inspires) (him|dylan)\b/,
  /\bwho\b.*\b(guy|person|dev|developer|creator|author|owner)\b.*\bbehind\b/,
  /^what does (he|dylan) care about\s*[?.!]*$/,
  /^how does (he|dylan) (work|think)\s*[?.!]*$/,
  /^what (is|was) (he|dylan) (most )?(curious|passionate|excited|proud(est)?) (about|of)\s*[?.!]*$/,
  /^what (is|was) (he|dylan) (best )?known for\s*[?.!]*$/,
  /^what are (his|dylan'?s|dylan’s) strengths\s*[?.!]*$/,
];

/**
 * Words that make a person question one the portfolio covers. A noun such as "work" counts only in "his work"
 * or "the work" (not "where does he work").
 */
const PORTFOLIO_TOPICS = new Set(
  tokenize(
    "project projects stack stacks language languages tool tools principle principles value values belief beliefs " +
      "believe philosophy built build builds building made make makes ship ships shipped shipping app apps product products " +
      "code coding tech technology technologies framework frameworks portfolio game games case study studies",
  ),
);
const HIS_WORK = /\b(his|dylan'?s|dylan’s|the|this|of) work\b/;

/**
 * Words in the about, principles or stack text that are also personal topics, so they never make a person
 * question covered ("is he free tomorrow", "does he own a house", "his number", "a family").
 */
const NOT_COVERING = new Set(
  tokenize(
    "work works worked working time team people place world post move today tomorrow cost benefit own real number " +
      "family go workers motion screen api control controls object objects durable free open available remote location " +
      "home city country rate rates price prices job jobs role roles",
  ),
);

/** Common English words that the about and principles text uses as topics ("range", "design", "his interests"). */
const TOPIC_COMMON = new Set(
  tokenize("choose range product idea design project built interest interests wide pattern reason limited good create making goal goals purpose whole size better"),
);

let personMemo: { hash: string; vocab: Set<string> } | undefined;

/** Words of the about and principles passages plus every stack entry, minus NOT_COVERING and common English other than TOPIC_COMMON. */
function personVocabulary(corpus: Corpus): Set<string> {
  if (personMemo?.hash !== corpus.hash) {
    const text = [...corpus.chunks.filter((c) => c.project === "profile" && c.section !== "projects").map((c) => c.text), ...caseStudies.flatMap((p) => p.stack)];
    const vocab = new Set(text.flatMap((t) => tokenize(t)).flatMap((t) => [t, ...baseForms(t)]));
    for (const w of [...GENERIC, ...ANCHORS, ...NOT_COVERING]) vocab.delete(w);
    for (const w of COMMON) if (!TOPIC_COMMON.has(w)) vocab.delete(w);
    personMemo = { hash: corpus.hash, vocab };
  }
  return personMemo.vocab;
}

/**
 * Is a question about the person one this portfolio answers? A question that names a project, or does not
 * mention the owner, is not this gate's business (true). Otherwise it is covered only if it has an intro shape
 * ("who is he", "tell me about him", "what does he do", "what is he like", "his background") or contains a
 * word from the about or principles text, a stack entry, or a portfolio-wide topic ("projects", "built",
 * "stack", "his work"). Anything else ("is he in austin", "is dylan at google", "who employs him") asks about
 * the person in a way the portfolio does not cover, and is deflected with zero model calls.
 */
export function personQuestionCovered(q: string, projects: string[], corpus: Corpus): boolean {
  const t = q.toLowerCase().trim();
  if (projects.length > 0 || !(PERSON_ANCHOR.test(t) || PERSON_BEHIND.test(t))) return true;
  if (INTRO_SHAPES.some((r) => r.test(t)) || HIS_WORK.test(t)) return true;
  const vocab = personVocabulary(corpus);
  const words = expandTokens(tokenize(t));
  return words.some((w) => PORTFOLIO_TOPICS.has(w) || vocab.has(w) || baseForms(w).some((b) => vocab.has(b) || PORTFOLIO_TOPICS.has(b)));
}
