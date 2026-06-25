import { describe, expect, it } from "vitest";
import { initPong, stepPong } from "@/components/retro/games/pong-engine";

describe("pong-engine", () => {
  it("starts serving with a 0-0 score", () => {
    const s = initPong(320, 200, 7, () => 0);
    expect(s.serving).toBe(true);
    expect(s.pScore).toBe(0);
    expect(s.aScore).toBe(0);
    expect(s.over).toBe(false);
  });

  it("launches the ball once the serve timer elapses", () => {
    const s = initPong(320, 200, 7, () => 0);
    stepPong(s, 1000); // exceed the 900ms serve delay
    expect(s.serving).toBe(false);
    expect(Math.abs(s.bvx)).toBeGreaterThan(0);
  });

  it("bounces the ball off the top and bottom walls", () => {
    const s = initPong(320, 200, 7);
    s.serving = false;
    s.bx = 160;
    s.by = 2;
    s.br = 4;
    s.bvx = 0.1;
    s.bvy = -0.1; // heading into the top wall
    const ev = stepPong(s, 16);
    expect(ev).toContain("wall");
    expect(s.bvy).toBeGreaterThan(0); // reflected downward
  });

  it("scores for the AI and re-serves when the ball exits the left edge", () => {
    const s = initPong(320, 200, 7);
    s.serving = false;
    s.bx = -10;
    s.br = 4;
    s.bvx = -0.5;
    s.bvy = 0;
    const ev = stepPong(s, 16);
    expect(ev).toContain("score");
    expect(s.aScore).toBe(1);
    expect(s.serving).toBe(true);
  });

  it("ends the game when a side reaches the win score", () => {
    const s = initPong(320, 200, 2);
    s.serving = false;
    s.pScore = 1;
    s.bx = 330;
    s.br = 4;
    s.bvx = 0.5;
    s.bvy = 0;
    stepPong(s, 16); // ball exits right → player scores the 2nd point
    expect(s.pScore).toBe(2);
    expect(s.over).toBe(true);
  });

  it("keeps the AI paddle within the field", () => {
    const s = initPong(320, 200, 7);
    s.serving = false;
    s.by = 5000; // pull the AI hard toward the bottom
    s.bvx = 1;
    for (let i = 0; i < 200; i++) stepPong(s, 16);
    expect(s.ay).toBeGreaterThanOrEqual(0);
    expect(s.ay).toBeLessThanOrEqual(s.h - s.ph);
  });
});
