export const MIN_Q = 3;
export const MAX_Q = 300;

export type Sanitized = { ok: true; q: string } | { ok: false; reason: "not_text" | "empty" | "too_long" };

const ZERO_WIDTH = /[\u200B-\u200F\u2060\uFEFF]/g;
const CONTROL = /\p{Cc}/gu;

export function sanitizeQuestion(raw: unknown): Sanitized {
  if (typeof raw !== "string") return { ok: false, reason: "not_text" };
  const q = raw
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL, "")
    .replace(/ {2,}/g, " ")
    .trim();
  if (q.replace(/[^\p{L}\p{N}]/gu, "").length < MIN_Q) return { ok: false, reason: "empty" };
  if (q.length > MAX_Q) return { ok: false, reason: "too_long" };
  return { ok: true, q };
}

const STOPWORDS = new Set(
  (
    "a an the and or but of to in on at by for from with about as is are was were be been am do does did " +
    "i me my you your we our it its this that these those what who whom which how why when where " +
    "can could would should will tell please so if than then there here com org www"
  ).split(" "),
);

/** Strip a plural "s" (but not "ss"/"us"/"is" endings on short words). Shared by corpus and questions. */
function stem(t: string): string {
  return t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

export function normalizeKey(q: string): string {
  return tokenize(q).join(" ");
}
