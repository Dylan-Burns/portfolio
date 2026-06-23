import { describe, it, expect } from "vitest";
import { ramp, starCount, seedStars, stepStar, type Star } from "@/components/retro/warp-field";

describe("ramp", () => {
  it("is a smoothstep from 0 to 1", () => {
    expect(ramp(0)).toBeCloseTo(0);
    expect(ramp(1)).toBeCloseTo(1);
    expect(ramp(0.5)).toBeCloseTo(0.5, 1);
    expect(ramp(0.25)).toBeLessThan(0.25); // ease-in first half
  });
});
describe("starCount", () => {
  it("scales with area and is capped at 3200", () => {
    expect(starCount(1280, 720, 1)).toBeGreaterThan(0);
    expect(starCount(10000, 10000, 2)).toBeLessThanOrEqual(3200);
  });
});
describe("seedStars / stepStar", () => {
  it("seeds n finite stars and advances z toward the viewer", () => {
    const stars: Star[] = seedStars(20, 800, 600, () => 0.5);
    expect(stars).toHaveLength(20);
    const s = { ...stars[0] };
    const z0 = s.z;
    expect(stepStar(s, 50, 800, 600, () => 0.5)).toBe(false); // not respawned
    expect(s.z).toBeLessThan(z0);       // moves closer
    expect(Number.isFinite(s.x)).toBe(true);
  });
  it("reports respawn and stays finite when a star passes the viewer", () => {
    const s = { x: 10, y: 10, z: 5, pz: 0, b: 0.5 };
    expect(stepStar(s, 9999, 800, 600, () => 0.5)).toBe(true); // crossed the near plane → respawn
    expect(Number.isFinite(s.z)).toBe(true);
    expect(s.z).toBeGreaterThanOrEqual(1);
  });
});
