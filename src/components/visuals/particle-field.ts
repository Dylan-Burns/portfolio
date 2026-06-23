/** Pure, DOM-free simulation helpers for ParticleField. Unit-tested in node. */

export type Density = "med" | "high";

export type Particle = {
  x: number; y: number;
  ox: number; oy: number;
  vx: number; vy: number;
  depth: number;
  size: number;
  base: number;
  tw: number;
  tws: number;
};

const HARD_CAP = 700;
const DENSITY_DIVISOR: Record<Density, number> = { med: 9000, high: 5200 };

export function particleCount(density: Density, w: number, h: number): number {
  const area = Math.max(0, w) * Math.max(0, h);
  const raw = Math.round(area / DENSITY_DIVISOR[density]);
  return Math.max(40, Math.min(HARD_CAP, raw));
}

export function shouldAnimate(opts: { reduceMotion: boolean; finePointer: boolean }): boolean {
  return !opts.reduceMotion && opts.finePointer;
}

const REPEL_STRENGTH = 2.2;

export function repelDelta(
  px: number, py: number, mx: number, my: number, radius: number, depth: number,
): { fx: number; fy: number } {
  const dx = px - mx;
  const dy = py - my;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return { fx: 0, fy: 0 };
  const d = Math.sqrt(d2) || 1;
  const f = (1 - d / radius) * REPEL_STRENGTH * depth;
  return { fx: (dx / d) * f, fy: (dy / d) * f };
}

export function seedParticles(
  n: number, w: number, h: number, rand: () => number = Math.random,
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const cluster = rand() < 0.55;
    let x: number, y: number;
    if (cluster) {
      const cx = w * 0.66, cy = h * 0.5;
      const r = Math.pow(rand(), 0.6) * Math.min(w, h) * 0.42;
      const a = rand() * Math.PI * 2;
      x = cx + Math.cos(a) * r * 1.3;
      y = cy + Math.sin(a) * r * 0.8;
    } else {
      x = rand() * w;
      y = rand() * h;
    }
    const depth = 0.3 + rand() * 0.7;
    out.push({
      x, y, ox: x, oy: y, vx: 0, vy: 0, depth,
      size: (0.6 + rand() * 1.3) * depth,
      base: 0.25 + rand() * 0.65,
      tw: rand() * Math.PI * 2,
      tws: 0.01 + rand() * 0.03,
    });
  }
  return out;
}
