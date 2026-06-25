/** Tiny localStorage helpers for the arcade. All guard for SSR / disabled storage. */

const PREFIX = "burnsos.hi.";

function read(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = Number(window.localStorage.getItem(PREFIX + key));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function write(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, String(value));
  } catch {
    /* private mode / quota — high scores are best-effort */
  }
}

/** Best score so far for a game (e.g. Snake). */
export function getHighScore(game: string): number {
  return read(game);
}

/** Record a score, keeping only the maximum. Returns the new best. */
export function setHighScore(game: string, score: number): number {
  const best = Math.max(read(game), score);
  write(game, best);
  return best;
}

/** A monotonically increasing counter (e.g. Pong wins). */
export function getCount(key: string): number {
  return read(key);
}

export function incCount(key: string): number {
  const next = read(key) + 1;
  write(key, next);
  return next;
}
