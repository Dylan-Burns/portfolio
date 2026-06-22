export type Star = { x: number; y: number; z: number; pz: number; b: number };

/** smoothstep-ish ease used for the warp acceleration. */
export function ramp(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const CAP = 3200;
export function starCount(w: number, h: number, dpr: number): number {
  return Math.min(CAP, Math.max(40, Math.round((w * h) / (2400 * Math.max(1, dpr)))));
}

export function makeStar(w: number, h: number, spread: boolean, rand: () => number): Star {
  return { x: (rand() * 2 - 1) * w, y: (rand() * 2 - 1) * h, z: spread ? rand() * w : w, pz: 0, b: 0.45 + rand() * 0.55 };
}
export function seedStars(n: number, w: number, h: number, rand: () => number = Math.random): Star[] {
  const out: Star[] = [];
  for (let i = 0; i < n; i++) out.push(makeStar(w, h, true, rand));
  return out;
}
/** Advance one star by `speed`; respawn at the far plane if it passes the viewer.
 * Returns true if it respawned this frame — the caller must SKIP drawing it that
 * frame (a fresh star has pz=0, which would make the streak projection divide by 0). */
export function stepStar(s: Star, speed: number, w: number, h: number, rand: () => number = Math.random): boolean {
  s.pz = s.z;
  s.z -= speed;
  if (s.z < 1) { Object.assign(s, makeStar(w, h, false, rand)); return true; }
  return false;
}
