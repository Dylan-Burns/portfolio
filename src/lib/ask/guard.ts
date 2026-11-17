/** Transport guards for /api/ask. Pure functions; no I/O beyond reading the request body. */

export const MAX_BODY_BYTES = 1024;
export const LIMIT_PER_MINUTE = 8;

const WINDOW_MS = 60_000;
const MAX_KEYS = 5000;

/**
 * An Origin header must be one of `allowed` exactly. With no Origin header, the request passes only
 * when the browser says it is same-origin (Sec-Fetch-Site). Everything else is refused.
 */
export function checkOrigin(req: Request, allowed: string[]): boolean {
  const origin = req.headers.get("origin");
  if (origin !== null) return allowed.includes(origin);
  return req.headers.get("sec-fetch-site") === "same-origin";
}

/**
 * Sliding-window limiter, in memory, so per server instance: it resets on a cold start and is not
 * shared across instances. It is a second layer behind the platform firewall rule, not the control.
 * Refused calls are not recorded, and the key map is pruned and capped so it cannot grow without bound.
 */
export function createLimiter(
  perMinute: number = LIMIT_PER_MINUTE,
  now: () => number = Date.now,
  maxKeys: number = MAX_KEYS,
): (key: string) => boolean {
  const hits = new Map<string, number[]>();
  let lastSweep = now();

  return (key) => {
    const t = now();
    if (t - lastSweep >= WINDOW_MS) {
      for (const [k, stamps] of hits) {
        if (stamps[stamps.length - 1] <= t - WINDOW_MS) hits.delete(k);
      }
      lastSweep = t;
    }

    const recent = (hits.get(key) ?? []).filter((s) => s > t - WINDOW_MS);
    if (recent.length >= perMinute) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.delete(key); // re-insert so the map stays in least-recently-used order
    hits.set(key, recent);
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
    return true;
  };
}

type Read = { ok: true; question: unknown } | { ok: false; status: 400 | 413 | 415 };

/** Reads at most MAX_BODY_BYTES; the stream is cancelled as soon as the cap is passed. */
async function readCapped(req: Request): Promise<string | null> {
  const declared = req.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    bytes.set(p, at);
    at += p.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** The body must be JSON of exactly `{ "question": string }`. Length and content are judged later. */
export async function readQuestion(req: Request): Promise<Read> {
  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return { ok: false, status: 415 };

  let text: string | null;
  try {
    text = await readCapped(req);
  } catch {
    return { ok: false, status: 400 };
  }
  if (text === null) return { ok: false, status: 413 };

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, status: 400 };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return { ok: false, status: 400 };
  const keys = Object.keys(data);
  const question = (data as Record<string, unknown>).question;
  if (keys.length !== 1 || keys[0] !== "question" || typeof question !== "string") return { ok: false, status: 400 };
  return { ok: true, question };
}
