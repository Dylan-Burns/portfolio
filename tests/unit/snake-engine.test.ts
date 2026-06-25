import { describe, expect, it } from "vitest";
import { initSnake, stepSnake, turn, type SnakeState } from "@/components/retro/games/snake-engine";

const fixedRand = () => 0; // deterministic food placement (first free cell)

describe("snake-engine", () => {
  it("seeds a 3-segment snake moving right with score 0", () => {
    const s = initSnake(20, 16, fixedRand);
    expect(s.body).toHaveLength(3);
    expect(s.dir).toBe("right");
    expect(s.score).toBe(0);
    expect(s.dead).toBe(false);
  });

  it("advances the head one cell in the current direction", () => {
    const s = initSnake(20, 16, fixedRand);
    const head = { ...s.body[0] };
    stepSnake(s, fixedRand);
    expect(s.body[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(s.body).toHaveLength(3); // length unchanged when not eating
  });

  it("ignores reversals onto its own neck", () => {
    const s = initSnake(20, 16, fixedRand);
    turn(s, "left"); // moving right → left would be a reversal
    stepSnake(s, fixedRand);
    expect(s.dir).toBe("right");
  });

  it("grows and scores when eating food", () => {
    const s = initSnake(20, 16, fixedRand);
    // drop food directly ahead of the head
    s.food = { x: s.body[0].x + 1, y: s.body[0].y };
    const events = stepSnake(s, fixedRand);
    expect(events).toContain("eat");
    expect(s.score).toBe(1);
    expect(s.body).toHaveLength(4);
  });

  it("dies on a wall collision", () => {
    const s = initSnake(6, 6, fixedRand);
    s.body = [{ x: 5, y: 2 }];
    s.dir = s.pendingDir = "right";
    const events = stepSnake(s, fixedRand);
    expect(events).toEqual(["die"]);
    expect(s.dead).toBe(true);
  });

  it("dies on a self collision", () => {
    // a tight U-turn that drives the head into the body
    const s: SnakeState = {
      cols: 10,
      rows: 10,
      body: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
      ],
      dir: "up",
      pendingDir: "up",
      food: { x: 0, y: 0 },
      score: 0,
      dead: false,
    };
    const events = stepSnake(s, fixedRand); // head 5,5 → 5,4 which is occupied
    expect(events).toEqual(["die"]);
    expect(s.dead).toBe(true);
  });
});
