import { touchesDeflectTopic } from "./intent";
import type { Chunk, ModelAnswer } from "./types";

export const ANSWER_MAX_CHARS = 600;

type Reason =
  | "unanswerable"
  | "no_citation"
  | "foreign_citation"
  | "number"
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

const TLDS =
  "com|org|net|io|dev|app|ai|co|edu|gov|me|xyz|info|biz|us|uk|ca|tv|sh|so|site|online|tech|cloud|example|test|invalid|localhost";
const LINK: RegExp[] = [
  /https?:\/\//i,
  /\bwww\./i,
  /[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+/i,
  new RegExp(String.raw`\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:${TLDS})\b`, "i"),
];

const MARKUP: RegExp[] = [
  /<\/?[a-z][^>]*>/i,
  /<[^<>\n]{1,40}>/,
  /!?\[[^\]]*\]\([^)]*\)/,
  /`/,
];

export function validateAnswer(a: ModelAnswer, supplied: Chunk[]): ValidationResult {
  if (!a.answerable) return { ok: false, reason: "unanswerable" };
  if (!a.citations || a.citations.length === 0) return { ok: false, reason: "no_citation" };
  const byId = new Map(supplied.map((c) => [c.id, c]));
  const cited = a.citations.map((id) => byId.get(id));
  if (cited.some((c) => !c)) return { ok: false, reason: "foreign_citation" };

  const source = (cited as Chunk[]).map((c) => c.text).join("\n");
  if (!numbersGrounded(a.answer, source)) return { ok: false, reason: "number" };
  if (LINK.some((r) => r.test(a.answer))) return { ok: false, reason: "link" };
  if (MARKUP.some((r) => r.test(a.answer))) return { ok: false, reason: "markup" };
  if (a.answer.length > ANSWER_MAX_CHARS) return { ok: false, reason: "length" };
  if (touchesDeflectTopic(a.answer)) return { ok: false, reason: "deflect_topic" };
  return { ok: true };
}
