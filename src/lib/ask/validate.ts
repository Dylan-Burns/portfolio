import { buildCorpus } from "./corpus";
import { touchesDeflectTopic } from "./intent";
import { stripInvisible } from "./text";
import type { Chunk, ModelAnswer } from "./types";

export const ANSWER_MAX_CHARS = 600;

type Reason =
  | "unanswerable"
  | "no_citation"
  | "foreign_citation"
  | "number"
  | "name"
  | "link"
  | "markup"
  | "length"
  | "deflect_topic";
export type ValidationResult = { ok: true } | { ok: false; reason: Reason };

const NUM = String.raw`\d+(?:\.\d+)?`;
const DASH = String.raw`\s*[-‐-―]\s*`;

// Drop thousands separators so "56,000" and "56000" compare equal.
function stripSeparators(s: string): string {
  return s.replace(/(?<=\d),(?=\d{3}(?!\d))/g, "");
}

// Whole numeric tokens ("0.94" is one token, never "0" or "94"). Percent wording
// is irrelevant because only the digits are compared, so 90%, 90 percent and
// 90 per cent all yield "90". Digits inside names (D1, S3, FTS5, GLP-1, 10-K)
// yield their digit run, which must then appear in the cited text too.
function numberTokens(s: string): string[] {
  return stripSeparators(s).match(new RegExp(NUM, "g")) ?? [];
}

function ranges(s: string): string[] {
  const out: string[] = [];
  for (const m of stripSeparators(s).matchAll(new RegExp(`(?<![\\w.])(${NUM})${DASH}(${NUM})(?![\\w.])`, "g"))) {
    out.push(`${m[1]}-${m[2]}`);
  }
  return out;
}

function numbersGrounded(answer: string, source: string): boolean {
  const have = new Set(numberTokens(source));
  if (!numberTokens(answer).every((n) => have.has(n))) return false;
  const haveRanges = new Set(ranges(source));
  return ranges(answer).every((r) => haveRanges.has(r));
}

const COMMON_TLDS = "com|org|net|io|ai|app|dev|co";
// Code-file style names that are legitimate words in answers (Next.js, node.ts).
const CODE_EXT = "js|ts|jsx|tsx|mjs|cjs|json|md|py|css|png|jpg|jpeg|gif|svg|webp|pdf|txt|html|csv";
const LINK: RegExp[] = [
  /\b[a-z][a-z0-9+.-]*:\/\//i,
  /\bhxxps?\b/i,
  /\bwww\./i,
  /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i,
  // Bare domain with any 2+ letter TLD that is all lower or all upper case, so "works.Then" is not a link.
  new RegExp(String.raw`\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?!(?:${CODE_EXT})\b)(?:[a-z]{2,}|[A-Z]{2,})\b`),
  // One-letter TLD ("evil.x"), only after a label of 3+ characters so "e.g" and "U.S" are left alone.
  /\b[A-Za-z0-9-]{3,}(?:\.[A-Za-z0-9-]+)*\.[a-z]\b/,
  // Domain split by spaces around the dot.
  new RegExp(String.raw`\b[A-Za-z0-9-]+\s+\.\s*(?:${COMMON_TLDS})\b|\b[A-Za-z0-9-]+\s*\.\s+(?:${COMMON_TLDS})\b`),
  // Spelled-out punctuation: "evil dot com", "a at b dot co", "[at]" / "[dot]".
  new RegExp(String.raw`\b\w+\s+dot\s+(?:${COMMON_TLDS})\b`, "i"),
  /\b\w+\s+(?:at|\[at\])\s+\w+\s+(?:dot|\[dot\])\s+\w+\b/i,
  /[\[(]\s*(?:dot|at)\s*[\])]/i,
];

const MARKUP: RegExp[] = [/<\/?[a-z][^>]*>/i, /<[^<>\n]{1,40}>/, /!?\[[^\]]*\]\([^)]*\)/, /`/];

// Latin letters (incl. accented), ASCII digits, whitespace and plain punctuation or math symbols.
// Markup-capable characters (< > ` [ ] { } | \ _ * # = @) are deliberately absent.
const ALLOWED_CHARS = /^[\p{Script=Latin}0-9\s.,;:!?'"()\-\u2013\u2014/%$&+\u00B7\u201C\u201D\u2018\u2019~\u2265\u00D7]*$/u;

const TENS = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
const NUMBER_WORD = new RegExp(
  String.raw`\b(?:(?:${TENS})(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundreds?|thousands?|millions?|billions?|trillions?|dozens?)\b`,
  "gi",
);

function numberWordsGrounded(answer: string, source: string): boolean {
  const low = source.toLowerCase();
  for (const m of answer.matchAll(NUMBER_WORD)) {
    if (!new RegExp(String.raw`(?<![\w-])${m[0].toLowerCase()}(?![\w-])`).test(low)) return false;
  }
  return true;
}

const SMALL_NUMBER_WORDS = "one|two|three|four|five|six|seven|eight|nine|ten";
// Relative-quantity words must be in the cited text verbatim, like numbers.
const RELATIVE_QUANTITY = new RegExp(
  String.raw`\b(?:halves|half|third|thirds|quarter|quarters|double|doubled|twice|triple|tripled|majority|most|dozens|hundreds|thousands|millions|billions|(?:\d[\d.,]*|${SMALL_NUMBER_WORDS}|${TENS}|hundred|thousand|million|billion)(?:-|\s+)times)\b`,
  "gi",
);

function relativeQuantitiesGrounded(answer: string, source: string): boolean {
  const low = source.toLowerCase();
  for (const m of answer.matchAll(RELATIVE_QUANTITY)) {
    const w = m[0].toLowerCase().replace(/\s+/g, " ");
    const key = w.endsWith("times") ? "times" : w;
    if (!new RegExp(String.raw`(?<![\w-])${key}(?![\w-])`).test(low)) return false;
  }
  return true;
}

const ALWAYS_OK_NAMES = new Set(["dylan", "burns", "i"]);
const WORD = /[\p{L}][\p{L}\p{N}]*(?:[.'\u2019-][\p{L}\p{N}]+)*/gu;

/** Light stemmer used only for membership tests, so "builds" and "built-in" style inflections still match. */
function stem(w: string): string {
  const x = w.toLowerCase().replace(/['\u2019]s$/, "");
  if (x.length > 4 && x.endsWith("ies")) return x.slice(0, -3) + "y";
  for (const suf of ["ing", "ed", "es", "ly", "s"]) {
    if (x.length - suf.length >= 3 && x.endsWith(suf)) return x.slice(0, -suf.length);
  }
  return x;
}

function parts(w: string): string[] {
  return w.split(/[.'\u2019-]/).filter(Boolean);
}

function addWord(set: Set<string>, w: string) {
  set.add(w.toLowerCase());
  set.add(stem(w));
  for (const p of parts(w)) {
    set.add(p.toLowerCase());
    set.add(stem(p));
  }
}

function inSet(set: Set<string>, w: string): boolean {
  return set.has(w.toLowerCase()) || set.has(stem(w));
}

const STARTERS = new Set(
  (
    "The It This That These Those He His Dylan A An In On At For With From To By And But Or So When While After " +
    "Before Each Every Both All Its They Their There Yes No Not One Two Three Four Five Six Seven Eight Nine Ten"
  )
    .toLowerCase()
    .split(" "),
);

// Very common English function and general words, so ordinary connective prose passes the grounding rule.
// No proper nouns, places, companies or personal names belong here.
export const COMMON_WORDS = [
  "about", "above", "across", "actually", "added", "adding", "adopted", "after", "again", "against", "aimed",
  "allow", "allows", "almost", "also", "although", "always", "among", "another", "answer", "answers",
  "anyone", "anything", "applies", "approach", "around", "aside", "asked", "asks", "aspect", "available",
  "based", "basic", "basically", "because", "become", "been", "before", "behind", "being", "belongs",
  "below", "benefit", "best", "better", "between", "beyond", "blend", "both", "bring", "brings", "broad",
  "builds", "built", "called", "calls", "came", "cannot", "care", "carries", "case", "cases", "centered",
  "certain", "change", "changes", "check", "checks", "choose", "chose", "claims", "clean", "clear",
  "clearly", "closely", "come", "comes", "common", "compared", "comparison", "complete", "concept",
  "consider", "contains", "context", "could", "cover", "covers", "created", "creates", "current", "deal",
  "default", "define", "delivers", "depends", "describes", "design", "designed", "details", "different",
  "direct", "directly", "does", "doing", "done", "down", "during", "each", "early", "easily", "effect",
  "efficient", "either", "else", "emphasis", "enough", "ensure", "ensures", "entire", "equal", "especially",
  "essentially", "even", "ever", "every", "everything", "evidence", "exactly", "example", "except", "exist",
  "exists", "explains", "extra", "fact", "fairly", "features", "find", "finds", "first", "following", "form",
  "found", "from", "fully", "further", "general", "generally", "gets", "given", "gives", "giving", "goal",
  "goals", "goes", "going", "good", "great", "group", "handle", "handled", "handles", "happens", "have",
  "having", "heavily", "help", "helped", "helping", "helps", "here", "higher", "himself", "hold", "holds",
  "however", "idea", "ideas", "important", "improve", "include", "includes", "including", "individual",
  "information", "inside", "instead", "intended", "interest", "interests", "interface", "into", "involved",
  "involves", "itself", "just", "keep", "keeping", "keeps", "kind", "know", "known", "label", "large",
  "later", "lead", "leading", "learn", "learned", "learning", "least", "leave", "less", "lets", "letting",
  "level", "like", "likely", "limited", "lines", "list", "little", "long", "look", "looks", "made", "main",
  "major", "make", "makes", "making", "manage", "manner", "many", "matter", "maybe", "mean", "means",
  "method", "methods", "might", "mixed", "model", "models", "more", "most", "mostly", "much", "multiple",
  "must", "name", "natural", "naturally", "near", "nearly", "need", "needs", "never", "newer", "next",
  "none", "normal", "noted", "nothing", "number", "numbers", "offer", "offers", "often", "older", "once",
  "ones", "only", "onto", "open", "order", "original", "other", "others", "otherwise", "outside", "over",
  "overall", "owner", "paired", "part", "particular", "parts", "pattern", "people", "percent", "period",
  "place", "plain", "plus", "point", "popular", "position", "possible", "practical", "prefer", "present",
  "previous", "primarily", "principle", "principles", "prior", "probably", "process", "produce", "product",
  "products", "project", "projects", "provide", "provides", "providing", "purpose", "quickly", "range",
  "ranges", "rate", "rather", "real", "realistic", "really", "reason", "recent", "refers", "reflects",
  "regular", "related", "relevant", "relies", "rely", "remains", "report", "require", "requires", "respect",
  "responsible", "result", "results", "return", "returns", "right", "role", "roles", "rule", "rules", "runs",
  "safe", "said", "same", "says", "second", "section", "seems", "seen", "select", "sense", "separate",
  "serves", "service", "sets", "setting", "setup", "several", "share", "shared", "shows", "similar",
  "simple", "simply", "since", "single", "size", "small", "solid", "solution", "solve", "some", "something",
  "sometimes", "sort", "source", "sources", "specific", "split", "stage", "stand", "standard", "start",
  "started", "state", "states", "step", "steps", "still", "stored", "strong", "structure", "style", "such",
  "summary", "support", "supports", "sure", "system", "systems", "takes", "target", "tasks", "team", "teams",
  "tell", "term", "terms", "test", "tests", "text", "than", "that", "their", "them", "then", "there",
  "these", "they", "thing", "things", "think", "this", "those", "though", "three", "through", "thus", "time",
  "times", "today", "together", "took", "tool", "tools", "topic", "total", "toward", "track", "true", "turn",
  "turns", "type", "types", "under", "understand", "understanding", "unique", "unlike", "until", "upon",
  "used", "useful", "uses", "using", "usually", "value", "various", "version", "very", "view", "want",
  "wants", "ways", "week", "well", "were", "what", "when", "where", "whether", "which", "while", "whole",
  "whose", "wide", "widely", "will", "with", "within", "without", "words", "work", "worked", "working",
  "works", "world", "would", "write", "wrote", "year", "years", "your", "yours",
];

function isSentenceInitial(text: string, index: number): boolean {
  const before = text.slice(0, index).replace(/[\s"'(\u201C\u2018]+$/u, "");
  return before === "" || /[.!?]$/.test(before);
}

// The portfolio's ordinary vocabulary, built once (the corpus is static for a build). A corpus word counts
// as ordinary when it is written lowercase somewhere or opens a sentence; a word only ever seen capitalized
// mid-sentence ("Google", "SQLite") is an entity name and must come from the cited text instead.
let corpusVocab: Set<string> | undefined;
function vocabulary(): Set<string> {
  if (!corpusVocab) {
    corpusVocab = new Set();
    for (const w of COMMON_WORDS) addWord(corpusVocab, w);
    for (const c of buildCorpus().chunks) {
      const t = c.text.normalize("NFKC");
      for (const m of t.matchAll(WORD)) {
        if (!/^\p{Lu}/u.test(m[0]) || isSentenceInitial(t, m.index)) addWord(corpusVocab, m[0]);
      }
    }
  }
  return corpusVocab;
}

/**
 * Grounding rule for words. Capitalized mid-sentence words must be in the cited text. A capitalized
 * sentence-initial word must be in the cited text, the corpus vocabulary or the starter list. Any
 * other word of four or more letters must be in the cited text, the corpus vocabulary or the starters.
 */
function namesGrounded(answer: string, source: string): boolean {
  const cited = new Set<string>();
  for (const m of source.matchAll(WORD)) addWord(cited, m[0]);
  const vocab = vocabulary();
  const known = (w: string) => inSet(cited, w) || inSet(vocab, w) || STARTERS.has(w.toLowerCase());
  for (const m of answer.matchAll(WORD)) {
    const w = m[0];
    const lower = w.toLowerCase();
    if (ALWAYS_OK_NAMES.has(lower.replace(/['\u2019]s$/, ""))) continue;
    const initial = isSentenceInitial(answer, m.index);
    if (/^\p{Lu}/u.test(w)) {
      if (initial ? !known(w) : !inSet(cited, w)) return false;
      continue;
    }
    if (parts(w).some((p) => p.length >= 4 && !known(p))) return false;
  }
  return true;
}

export function validateAnswer(a: ModelAnswer, supplied: Chunk[]): ValidationResult {
  const answer = stripInvisible(a.answer.normalize("NFKC")).trim();
  if (!a.answerable || answer === "") return { ok: false, reason: "unanswerable" };
  if (!a.citations || a.citations.length === 0) return { ok: false, reason: "no_citation" };
  const byId = new Map(supplied.map((c) => [c.id, c]));
  const cited = a.citations.map((id) => byId.get(id));
  if (cited.some((c) => !c)) return { ok: false, reason: "foreign_citation" };

  const source = stripInvisible((cited as Chunk[]).map((c) => c.text).join("\n").normalize("NFKC"));
  if (/[^\x00-\x7F]/.test(answer.replace(/[^\p{Nd}]/gu, "")) || !numbersGrounded(answer, source) || !numberWordsGrounded(answer, source) || !relativeQuantitiesGrounded(answer, source)) {
    return { ok: false, reason: "number" };
  }
  if (LINK.some((r) => r.test(answer))) return { ok: false, reason: "link" };
  if (MARKUP.some((r) => r.test(answer)) || !ALLOWED_CHARS.test(answer)) return { ok: false, reason: "markup" };
  if (answer.length > ANSWER_MAX_CHARS) return { ok: false, reason: "length" };
  if (!namesGrounded(answer, source)) return { ok: false, reason: "name" };
  if (touchesDeflectTopic(answer)) return { ok: false, reason: "deflect_topic" };
  return { ok: true };
}
