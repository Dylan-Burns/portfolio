import { describe, it, expect } from "vitest";
import {
  particleCount,
  shouldAnimate,
  repelDelta,
  seedParticles,
  type Particle,
} from "@/components/visuals/particle-field";

describe("particleCount", () => {
  it("scales with density and area, and is capped", () => {
    expect(particleCount("med", 1280, 720)).toBeGreaterThan(0);
    expect(particleCount("high", 1280, 720)).toBeGreaterThan(particleCount("med", 1280, 720));
    expect(particleCount("high", 10000, 10000)).toBeLessThanOrEqual(700);
  });
});

describe("shouldAnimate", () => {
  it("only animates with motion allowed AND a fine pointer", () => {
    expect(shouldAnimate({ reduceMotion: false, finePointer: true })).toBe(true);
    expect(shouldAnimate({ reduceMotion: true, finePointer: true })).toBe(false);
    expect(shouldAnimate({ reduceMotion: false, finePointer: false })).toBe(false);
  });
});

describe("repelDelta", () => {
  it("is zero outside the radius", () => {
    const d = repelDelta(0, 0, 500, 500, 180, 1);
    expect(d.fx).toBe(0);
    expect(d.fy).toBe(0);
  });
  it("pushes the particle away from the pointer when inside the radius", () => {
    const d = repelDelta(10, 0, 0, 0, 180, 1);
    expect(d.fx).toBeGreaterThan(0);
    expect(Math.abs(d.fy)).toBeLessThan(1e-6);
  });
});

describe("seedParticles", () => {
  it("creates exactly n particles within the canvas bounds", () => {
    const ps: Particle[] = seedParticles(50, 800, 600, () => 0.5);
    expect(ps).toHaveLength(50);
    for (const p of ps) {
      expect(Number.isFinite(p.ox)).toBe(true);
      expect(Number.isFinite(p.oy)).toBe(true);
      expect(p.depth).toBeGreaterThan(0);
    }
  });
});
