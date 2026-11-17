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
  /https?:\/\//i,
  /\bwww\./i,
  /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i,
  // Bare domain with any 2+ letter TLD that is all lower or all upper case, so "works.Then" is not a link.
  new RegExp(String.raw`\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?!(?:${CODE_EXT})\b)(?:[a-z]{2,}|[A-Z]{2,})\b`),
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

const ALWAYS_OK_NAMES = new Set(["dylan", "burns", "i"]);
const WORD = /[\p{L}][\p{L}\p{N}]*(?:[.'\u2019-][\p{L}\p{N}]+)*/gu;

function wordForms(w: string): string[] {
  const base = w.toLowerCase().replace(/['\u2019]s$/, "");
  return [base, base.replace(/s$/, ""), base + "s"];
}

function namesGrounded(answer: string, source: string): boolean {
  const have = new Set<string>();
  for (const m of source.matchAll(WORD)) for (const f of wordForms(m[0])) have.add(f);
  for (const m of answer.matchAll(WORD)) {
    const w = m[0];
    if (!/^\p{Lu}/u.test(w)) continue;
    const before = answer.slice(0, m.index).replace(/[\s"'(\u201C\u2018]+$/u, "");
    if (before === "" || /[.!?]$/.test(before)) continue;
    if (ALWAYS_OK_NAMES.has(w.toLowerCase())) continue;
    if (!wordForms(w).some((f) => have.has(f))) return false;
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
  if (/[^\x00-\x7F]/.test(answer.replace(/[^\p{Nd}]/gu, "")) || !numbersGrounded(answer, source) || !numberWordsGrounded(answer, source)) {
    return { ok: false, reason: "number" };
  }
  if (!namesGrounded(answer, source)) return { ok: false, reason: "name" };
  if (LINK.some((r) => r.test(answer))) return { ok: false, reason: "link" };
  if (MARKUP.some((r) => r.test(answer)) || !ALLOWED_CHARS.test(answer)) return { ok: false, reason: "markup" };
  if (answer.length > ANSWER_MAX_CHARS) return { ok: false, reason: "length" };
  if (touchesDeflectTopic(answer)) return { ok: false, reason: "deflect_topic" };
  return { ok: true };
}
