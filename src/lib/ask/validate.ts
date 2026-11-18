import { ALLOW_WORDS } from "./allow-words";
import { buildCorpus, projectName } from "./corpus";
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
  | "deflect_topic"
  | "grounding"
  | "affirmation";
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

// Tags, links, backticks, and passage IDs ("keel/outcomes/1": the model's own context, never prose).
const MARKUP: RegExp[] = [/<\/?[a-z][^>]*>/i, /<[^<>\n]{1,40}>/, /!?\[[^\]]*\]\([^)]*\)/, /`/, /\b[a-z]+\/[a-z]+\/\d+\b/i];

/**
 * "=" is not an allowed character, except inside a span copied verbatim from the cited text
 * ("(Ax = b)", "SameSite=Strict"). Such spans are blanked before the character check.
 */
function withoutCopiedEquals(answer: string, source: string): string {
  return answer.replace(/\S*\s?=\s?\S*/g, (m) => {
    const core = m.replace(/^[("'\u201C\u2018]+|[.,;:!?)"'\u201D\u2019]+$/gu, "");
    return core.includes("=") && source.includes(core) ? m.replace(/=/g, " ") : m;
  });
}

// Latin letters (incl. accented), ASCII digits, whitespace and plain punctuation or math symbols.
// Markup-capable characters (< > ` [ ] { } | \ _ * # = @) are deliberately absent.
const ALLOWED_CHARS = /^[\p{Script=Latin}0-9\s.,;:!?'"()\-\u2013\u2014/%$&+\u00B7\u201C\u201D\u2018\u2019~\u2265\u00D7]*$/u;

const TENS = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
const NUMBER_WORD = new RegExp(
  String.raw`\b(?:(?:${TENS})(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundreds?|thousands?|millions?|billions?|trillions?|dozens?)\b`,
  "gi",
);

/**
 * Each number word must appear in the cited text as the same whole token. A word joined to a compound
 * ("million-barrel") must match the whole compound, so "a million barrels" is not grounded by
 * "1.14 million-barrel", and "twenty" is not grounded by "twenty-five".
 */
function numberWordsGrounded(answer: string, source: string): boolean {
  const low = source.toLowerCase();
  for (const m of answer.matchAll(SMALL_NUMBER_WORD)) {
    // "five" inside "twenty-five" is the larger word's business; otherwise the word must be in the cited
    // text, alone or as the head of a compound ("five-step" grounds "five steps", "one-, two-" grounds "one").
    if (/[\p{L}]-$/u.test(answer.slice(0, m.index))) continue;
    if (!new RegExp(String.raw`(?<![\w-])${m[0].toLowerCase()}(?![a-z])`).test(low)) return false;
  }
  for (const m of answer.matchAll(NUMBER_WORD)) {
    const compound = answer.slice(m.index + m[0].length).match(/^(?:-[\p{L}]+)+/u)?.[0] ?? "";
    const token = (m[0] + compound).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(String.raw`(?<![\w-])${token}(?![\w-])`, "u").test(low)) return false;
  }
  return true;
}

const SMALL_NUMBER_WORDS = "one|two|three|four|five|six|seven|eight|nine|ten";
// One to ten are checked like larger number words ("a team of five", "five projects").
const SMALL_NUMBER_WORD = new RegExp(String.raw`\b(?:${SMALL_NUMBER_WORDS})\b`, "gi");
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

/**
 * Membership forms of a word, so inflections match: the word, the word without a regular suffix, and after
 * -ed/-ing/-es the base plus "e" ("admired" -> "admire") and with a doubled final consonant undoubled
 * ("plotted" -> "plot"). A bare word is never trimmed, so "plane" and "plan" stay different words.
 */
function forms(w: string, withE = true): string[] {
  const x = w.toLowerCase().replace(/['\u2019]s$/, "");
  if (x.length > 4 && x.endsWith("ies")) return [x, x.slice(0, -3) + "y"];
  if (x.length > 4 && x.endsWith("ied")) return [x, x.slice(0, -3) + "y"];
  for (const suf of ["ing", "ed", "es", "ly", "s"]) {
    if (x.length - suf.length >= 3 && x.endsWith(suf)) {
      const base = x.slice(0, -suf.length);
      const out = [x, base];
      if (withE && (suf === "ing" || suf === "ed" || suf === "es")) out.push(base + "e");
      if ((suf === "ing" || suf === "ed") && /([b-df-hj-np-tv-z])\1$/.test(base)) out.push(base.slice(0, -1));
      return out;
    }
  }
  return [x];
}

function parts(w: string): string[] {
  return w.split(/[.'\u2019-]/).filter(Boolean);
}

// Known words are stored without the "+e" guess and looked up with it: an answer's "admires" finds a known
// "admired" (both reach "admir"), but a known "hated" or "role-based" never vouches for a bare "hate" or "base".
function addWord(set: Set<string>, w: string) {
  for (const f of forms(w, false)) set.add(f);
  for (const p of parts(w)) for (const f of forms(p, false)) set.add(f);
}

function inSet(set: Set<string>, w: string): boolean {
  return forms(w).some((f) => set.has(f));
}

export const STARTERS = new Set(
  (
    "The It This That These Those He His Dylan A An In On At For With From To By And But Or So When While After " +
    "Before Each Every Both Either Neither All Its They Their There Not One Two Three Four Five Six Seven Eight Nine Ten"
  )
    .toLowerCase()
    .split(" "),
);

// Very common English function and general words, so ordinary connective prose passes the grounding rule.
// Same admission rule as allow-words.ts (Task 11 fix round 3): nothing that can assert a fact or status by
// itself, and no time claims, quality or popularity comparisons, availability, money, employment, education,
// places, greetings or filler. Those moved to COMMON_NOT_GROUNDING below.
export const COMMON_WORDS = [
  "about", "above", "across", "added", "adding", "after", "again", "against", "aimed", "allow", "allows",
  "almost", "also", "although", "always", "among", "another", "answer", "answers", "anyone", "anything",
  "applies", "approach", "around", "aside", "asked", "asks", "aspect", "based", "basic", "because", "become",
  "been", "before", "behind", "being", "belongs", "below", "between", "beyond", "blend", "both", "bring",
  "brings", "broad", "builds", "built", "called", "calls", "came", "cannot", "care", "carries", "case",
  "cases", "centered", "certain", "change", "changes", "check", "checks", "choose", "chose", "claims", "clean",
  "clear", "clearly", "closely", "come", "comes", "common", "compared", "comparison", "concept", "consider",
  "contains", "context", "could", "cover", "covers", "created", "creates", "default", "define", "delivers",
  "depends", "describes", "design", "designed", "details", "different", "direct", "directly", "does", "doing",
  "done", "down", "during", "each", "easily", "effect", "either", "else", "emphasis", "enough", "ensure",
  "ensures", "entire", "equal", "especially", "essentially", "even", "ever", "every", "everything", "evidence",
  "exactly", "example", "except", "exist", "exists", "explains", "extra", "fact", "fairly", "features", "find",
  "finds", "first", "following", "form", "found", "from", "fully", "further", "general", "generally", "gets",
  "given", "gives", "giving", "goal", "goals", "goes", "going", "group", "handle", "handled", "handles",
  "happens", "have", "having", "help", "helped", "helping", "helps", "here", "himself", "hold", "holds",
  "however", "idea", "ideas", "improve", "include", "includes", "including", "individual", "information",
  "inside", "instead", "intended", "interest", "interests", "interface", "into", "involved", "involves",
  "itself", "just", "keep", "keeping", "keeps", "kind", "know", "label", "large", "least", "leave", "less",
  "lets", "letting", "level", "like", "likely", "limited", "lines", "list", "little", "long", "look", "looks",
  "made", "main", "make", "makes", "making", "manage", "manner", "many", "matter", "mean", "means", "method",
  "methods", "might", "mixed", "model", "models", "more", "most", "mostly", "much", "multiple", "must", "name",
  "natural", "naturally", "near", "nearly", "need", "needs", "never", "next", "none", "normal", "noted",
  "nothing", "number", "numbers", "often", "once", "ones", "only", "onto", "order", "original", "other",
  "others", "otherwise", "outside", "over", "overall", "paired", "part", "particular", "parts", "pattern",
  "people", "percent", "place", "plain", "plus", "point", "possible", "practical", "prefer", "present",
  "primarily", "principle", "principles", "process", "produce", "product", "products", "project", "projects",
  "provide", "provides", "providing", "purpose", "quickly", "range", "ranges", "rather", "real", "realistic",
  "reason", "refers", "reflects", "regular", "related", "relevant", "relies", "rely", "remains", "report",
  "require", "requires", "respect", "result", "results", "return", "returns", "right", "rule", "rules", "runs",
  "said", "same", "says", "second", "section", "seems", "seen", "select", "sense", "separate", "serves",
  "service", "sets", "setting", "setup", "several", "share", "shared", "shows", "similar", "simple", "simply",
  "single", "size", "small", "solution", "solve", "some", "something", "sometimes", "sort", "source",
  "sources", "specific", "split", "stage", "stand", "standard", "start", "started", "step", "steps", "still",
  "stored", "structure", "style", "such", "summary", "support", "supports", "system", "systems", "takes",
  "target", "tasks", "team", "teams", "tell", "term", "terms", "test", "tests", "text", "than", "that",
  "their", "them", "then", "there", "these", "they", "thing", "things", "think", "this", "those", "though",
  "three", "through", "thus", "time", "times", "together", "took", "tool", "tools", "topic", "total", "toward",
  "track", "true", "turn", "turns", "type", "types", "under", "understand", "understanding", "unlike", "until",
  "upon", "used", "useful", "uses", "using", "usually", "value", "various", "version", "very", "view", "want",
  "wants", "ways", "well", "were", "what", "when", "where", "whether", "which", "while", "whole", "whose",
  "wide", "will", "with", "within", "without", "words", "work", "works", "would", "write", "wrote", "your",
  "yours",
];

/**
 * Common words taken out of COMMON_WORDS in fix round 3 because they can assert a fact or status by themselves
 * ("best", "year", "available", "worked", "learned", ...). They no longer ground an answer; the scope gate
 * still treats them as ordinary English (scope.ts), so which questions reach retrieval is unchanged.
 */
export const COMMON_NOT_GROUNDING = [
  "actually", "adopted", "available", "basically", "benefit", "best", "better", "complete", "current", "deal",
  "early", "efficient", "good", "great", "heavily", "higher", "important", "known", "later", "lead", "leading",
  "learn", "learned", "learning", "major", "maybe", "newer", "offer", "offers", "older", "open", "owner",
  "period", "popular", "position", "previous", "prior", "probably", "rate", "really", "recent", "responsible",
  "role", "roles", "safe", "since", "solid", "state", "states", "strong", "sure", "today", "unique", "week",
  "widely", "worked", "working", "world", "year", "years",
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
    for (const w of ALLOW_WORDS) addWord(corpusVocab, w);
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
 * Grounding rule for words. A capitalized word must be in the cited text (which includes the cited passages'
 * project names), or, at the start of a sentence, be one of the STARTERS. Any other word of four or more
 * letters must be in the cited text, the corpus vocabulary, COMMON_WORDS, ALLOW_WORDS or the starters.
 * Returns the first word that breaks the rule (the live eval reports it), or undefined.
 */
export function ungroundedWord(answer: string, source: string): string | undefined {
  const cited = new Set<string>();
  for (const m of source.matchAll(WORD)) addWord(cited, m[0]);
  const vocab = vocabulary();
  const known = (w: string) => inSet(cited, w) || inSet(vocab, w) || STARTERS.has(w.toLowerCase());
  for (const m of answer.matchAll(WORD)) {
    const w = m[0];
    const lower = w.toLowerCase();
    if (ALWAYS_OK_NAMES.has(lower.replace(/['\u2019]s$/, ""))) continue;
    if (/^\p{Lu}/u.test(w)) {
      // A sentence-initial Yes or No passes here; affirmationsGrounded decides whether it may stand.
      const ok = inSet(cited, w) || (isSentenceInitial(answer, m.index) && (STARTERS.has(lower) || AFFIRMATION_WORD.test(w)));
      if (!ok) return w;
      continue;
    }
    const bad = parts(w).find((p) => p.length >= 4 && !known(p));
    if (bad !== undefined) return bad;
  }
  return undefined;
}

function namesGrounded(answer: string, source: string): boolean {
  return ungroundedWord(answer, source) === undefined;
}

/**
 * Family, home and education statements about the owner (he/his/Dylan as the subject). A project passage
 * that uses such a word about the product ("an accountability partner", "the whole team") never matches,
 * because these need the owner as subject or possessor. The one exception: the same phrase in the first
 * person ("I moved", "my family") is in the cited text, i.e. the profile says it.
 */
const FAMILY = String.raw`mother|father|mom|dad|parents?|wife|husband|partner|girlfriend|boyfriend|fianc\w*|daughters?|sons?|child|children|kids?|siblings?|brothers?|sisters?|family|wedding|marriage`;
const HOME = String.raw`home|house|apartment|city|town|neighbou?rhood|country|hometown`;
const EDUCATION = String.raw`school|campus|degree|diploma|professor|teacher|classes|studies|university|college`;
const PERSONAL_ANSWER: RegExp[] = [
  new RegExp(String.raw`\b(?:his|dylan(?: burns)?'?s|dylan(?: burns)?’s) (?:${FAMILY}|${HOME}|${EDUCATION})\b`),
  new RegExp(String.raw`\b(?:he|dylan(?: burns)?) (?:has|had) (?:a |an |one |two |three |\d+ )?(?:${FAMILY})\b`),
  /\b(?:he|dylan(?: burns)?) (?:is|was|got|became) (?:now |currently |once )?(?:married|engaged|divorced|a parent|a father|a dad|a student|a professor|a teacher|a graduate|studying|in school|at school)\b/,
  /\b(?:he|dylan(?: burns)?) (?:moved|moves|relocated|lives|lived|grew up|resides|studied|studies|graduated|teaches|taught|attended|enrolled)\b/,
];

function touchesPersonalLife(answer: string, source: string): boolean {
  const a = answer.toLowerCase();
  const src = source.toLowerCase();
  return PERSONAL_ANSWER.some((r) => {
    const m = a.match(r);
    if (!m) return false;
    const firstPerson = m[0].replace(/^(?:his|dylan(?: burns)?'?s|dylan(?: burns)?’s)\b/, "my").replace(/^(?:he|dylan(?: burns)?)\b/, "i");
    return !src.includes(firstPerson);
  });
}

/**
 * Grounding overlap (final fix wave). Every check above asks whether each word is allowed; none asks whether
 * the answer says anything the cited text says, so "Yes, he is." or "He is gay." passed. These do:
 *  - the answer has at least MIN_GROUNDED_WORDS distinct content words (four or more letters, not a function
 *    word, not Dylan or Burns) that are in the cited text, and so does its first sentence;
 *  - every word of three letters or fewer is in SHORT_FUNCTION_WORDS or in the cited text;
 *  - an evaluative or negative word, and the word a negation applies to, is in the cited text (the negated
 *    word in a cited sentence that is itself negative).
 * A sentence that opens with an affirmation (Yes, No, Correct, ...) must itself be grounded and be followed by
 * a grounded sentence (affirmationsGrounded). None of this checks truth: a sentence assembled from cited
 * words can still say something the passages do not.
 */
export const MIN_GROUNDED_WORDS = 3;
/** The first sentence's own minimum: 3 rejected 7 more of 312 cached validated answers than 2 (eval log). */
export const FIRST_SENTENCE_WORDS = 2;

/**
 * Words of three letters or fewer accepted without the cited text: articles, pronouns, prepositions,
 * conjunctions and auxiliaries, the possessive and contraction fragments "s" and "t", and e.g./i.e./etc.
 * Closed classes only: no noun, adjective or verb that can carry a claim by itself ("job", "bad", "gay",
 * "old", "fee", "dad", "ill" are not here, so they need the cited text). Number words are checked as numbers.
 */
export const SHORT_FUNCTION_WORDS: ReadonlySet<string> = new Set(
  (
    "a an the and or but nor so yet if as at by for in of on to up via per vs off out " +
    "is are was be am do did has had can may it its he his him i me my we our us you who how why " +
    "not no s t e.g i.e etc " +
    // Generic software words that assert nothing by themselves.
    "app web use set run end way new all any"
  ).split(" "),
);

/** Function words of four or more letters: they never count as grounded content. */
const LONG_FUNCTION_WORDS = new Set(
  (
    "that this with from have does been were they them their there these those which what when where whom whose " +
    "also into than then each only more most some such very will would could should shall might must about other " +
    "being both every within without because before after over under between through itself himself across along " +
    "among upon onto toward towards whether either neither although though however just even still much many here " +
    "your yours ours theirs while until unless"
  ).split(" "),
);

/** Evaluative and negative claims about Dylan or a project; each needs the same word in the cited text. */
const EVALUATIVE = new RegExp(
  String.raw`\b(?:bad|badly|worse|worst|poor|poorly|terrible|awful|horrible|useless|pointless|broken|buggy|insecure|unsafe|` +
    String.raw`unreliable|untrustworthy|slow|wrong|fail|fails|failed|failing|failure|failures|leak|leaks|leaked|leaking|lie|lies|lied|liar|` +
    String.raw`fake|fraud|scam|steal|steals|stole|stolen|sell|sells|sold|copy|copies|copied|plagiari\w*|incompetent|lazy|amateur\w*|` +
    String.raw`mediocre|weak|weakness\w*|flaw|flaws|flawed|garbage|trash|junk|sucks?|hate|hates|dangerous|harmful|illegal|abandoned|` +
    String.raw`dead|discontinued|unfinished|incomplete|incorrect|inaccurate|overrated|risky|vulnerable|exposes?|abuses?)\b`,
  "gi",
);

const NEGATION = String.raw`not|never|cannot|no|nor|n't|without`;
const NEGATED = new RegExp(String.raw`(?:\b(?:${NEGATION.replace("|n't", "")})\b|n't\b)((?:\s+[\p{L}'’-]+){1,4})`, "giu");
/** Words skipped when finding what a negation applies to ("does not really work" -> "work"). */
const NEGATION_FILLER = new Set(
  "a an the any be been being is are was were do does did have has had to at all really always yet very so too one more longer".split(" "),
);
const IS_NEGATIVE = new RegExp(String.raw`(?:\b(?:${NEGATION.replace("|n't", "")})\b|n't\b)`, "i");

/** A sentence-initial affirmation or bare verdict. */
const AFFIRMATION_WORD = /^(?:yes|no|yeah|yep|nope|correct|incorrect|right|true|false|indeed|exactly|sure|absolutely|definitely|certainly)$/i;

function sentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (const m of text.matchAll(/[.!?]+(?=\s|$)/g)) {
    const before = text.slice(start, m.index);
    if (/(?:^|\s)(?:e\.g|i\.e|etc|vs)$/i.test(before)) continue;
    out.push(text.slice(start, m.index + m[0].length).trim());
    start = m.index + m[0].length;
  }
  const rest = text.slice(start).trim();
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

/**
 * The distinct content tokens of `text` that are in the cited text: words of four or more letters that are not
 * function words (nor Dylan or Burns), plus figures and short names written with a digit or a capital
 * ("4.99", "D1", "EC", "Pro" mid-sentence), which only count when the cited text has them.
 */
function groundedContent(text: string, cited: Set<string>, citedNumbers: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const n of numberTokens(text)) if (citedNumbers.has(n)) out.add(n);
  for (const m of text.matchAll(WORD)) {
    const w = m[0];
    const lower = w.toLowerCase().replace(/['\u2019]s$/, "");
    if (LONG_FUNCTION_WORDS.has(lower) || ALWAYS_OK_NAMES.has(lower)) continue;
    const long = lower.replace(/[^\p{L}]/gu, "").length >= 4;
    const marked = /\d/.test(w) || /^.+\p{Lu}/u.test(w) || (/^\p{Lu}/u.test(w) && !isSentenceInitial(text, m.index));
    if ((long || marked) && inSet(cited, lower)) out.add(forms(lower, false).at(-1)!);
  }
  return out;
}

/** The first word of three letters or fewer that is neither a function word nor cited, or undefined. */
function ungroundedShortWord(answer: string, cited: Set<string>): string | undefined {
  for (const m of answer.matchAll(WORD)) {
    // A sentence-initial Yes or No is the affirmation rule's to judge.
    if (AFFIRMATION_WORD.test(m[0]) && isSentenceInitial(answer, m.index)) continue;
    const pieces = m[0].includes(".") ? [m[0]] : m[0].split(/['’-]/).filter(Boolean);
    for (const p of pieces) {
      const lower = p.toLowerCase();
      if (lower.length > 3 || SHORT_FUNCTION_WORDS.has(lower) || /\d/.test(lower)) continue;
      if (!inSet(cited, lower)) return lower;
    }
  }
  return undefined;
}

/** The first evaluative word, or negated word, that the cited text does not support, or undefined. */
function ungroundedClaim(answer: string, cited: Set<string>, source: string): string | undefined {
  for (const m of answer.matchAll(EVALUATIVE)) if (!inSet(cited, m[0])) return m[0].toLowerCase();
  const negativeSentences = sentences(source).filter((s) => IS_NEGATIVE.test(s));
  for (const m of answer.matchAll(NEGATED)) {
    const words = (m[1].match(/[\p{L}'’-]+/gu) ?? []).map((w) => w.toLowerCase());
    const target = words.find((w) => !NEGATION_FILLER.has(w) && !SHORT_FUNCTION_WORDS.has(w));
    if (!target) continue;
    const ok = negativeSentences.some((s) => {
      const set = new Set<string>();
      for (const w of s.matchAll(WORD)) addWord(set, w[0]);
      return inSet(set, target);
    });
    if (!ok) return `${m[0].trim().split(/\s+/)[0]} ${target}`;
  }
  return undefined;
}

function affirmationsGrounded(parts: string[], count: (t: string) => number, minWords: number): boolean {
  return parts.every((s, i) => {
    const first = s.match(WORD)?.[0];
    if (!first || !AFFIRMATION_WORD.test(first) || s.search(WORD) > 2) return true;
    const later = parts.slice(i + 1).some((t) => count(t) >= minWords);
    return count(s) >= minWords && later;
  });
}

/**
 * Why the answer is not grounded ("affirmation", "overlap", "first sentence", "short: job", "claim: bad"), or
 * undefined. `minWords` applies to the whole answer and to an affirmation's own sentence; the first sentence
 * needs FIRST_SENTENCE_WORDS (see the eval log, final fix wave, for both thresholds measured).
 */
function groundingProblem(answer: string, source: string, minWords = MIN_GROUNDED_WORDS, firstWords = FIRST_SENTENCE_WORDS): string | undefined {
  const cited = new Set<string>();
  for (const m of source.matchAll(WORD)) addWord(cited, m[0]);
  const citedNumbers = new Set(numberTokens(source));
  const count = (t: string) => groundedContent(t, cited, citedNumbers).size;
  const parts = sentences(answer);
  if (!affirmationsGrounded(parts, count, minWords)) return "affirmation";
  if (count(answer) < minWords) return "overlap";
  if (count(parts[0] ?? "") < firstWords) return "first sentence";
  // Talk about "the passages" is the model describing its context, not the portfolio (the prompt forbids it).
  if (/\bpassages\b/i.test(answer) && !/\bpassages\b/i.test(source)) return "meta: passages";
  const short = ungroundedShortWord(answer, cited);
  if (short !== undefined) return `short: ${short}`;
  const claim = ungroundedClaim(answer, cited, source);
  if (claim !== undefined) return `claim: ${claim}`;
  return undefined;
}

/**
 * The grounding verdict in detail, at any overlap threshold; `source` is the cited text plus the cited
 * passages' project names, as validateAnswer builds it. The live eval and the eval log report it.
 */
export function groundingDetail(answer: string, source: string, minWords = MIN_GROUNDED_WORDS, firstWords = FIRST_SENTENCE_WORDS): string | undefined {
  return groundingProblem(stripInvisible(answer.normalize("NFKC")).trim(), stripInvisible(source.normalize("NFKC")), minWords, firstWords);
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
  if (MARKUP.some((r) => r.test(answer)) || !ALLOWED_CHARS.test(withoutCopiedEquals(answer, source))) return { ok: false, reason: "markup" };
  if (answer.length > ANSWER_MAX_CHARS) return { ok: false, reason: "length" };
  // A cited passage is grounded in its own project, so that project's name counts as cited text
  // ("Designed, built, and shipped solo." is a Claruss passage). Names of uncited projects do not.
  const names = (cited as Chunk[]).map(projectName).filter(Boolean).join("\n");
  if (!namesGrounded(answer, `${source}\n${names}`)) return { ok: false, reason: "name" };
  if (touchesDeflectTopic(answer) || touchesPersonalLife(answer, source)) return { ok: false, reason: "deflect_topic" };
  const problem = groundingProblem(answer, `${source}\n${names}`);
  if (problem) return { ok: false, reason: problem === "affirmation" ? "affirmation" : "grounding" };
  return { ok: true };
}
