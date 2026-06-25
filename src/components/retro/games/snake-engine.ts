/** Pure, DOM-free Snake simulation. Unit-tested in node (see tests/unit/snake-engine.test.ts).
 *  Classic rules: walls and self-collision are fatal; eating food grows the snake. */

export type Dir = "up" | "down" | "left" | "right";
export type Cell = { x: number; y: number };

export type SnakeState = {
  cols: number;
  rows: number;
  body: Cell[]; // head at index 0
  dir: Dir;
  pendingDir: Dir; // direction applied on the next tick (input is queued)
  food: Cell;
  score: number;
  dead: boolean;
};

export type SnakeEvent = "eat" | "die";

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export function initSnake(cols: number, rows: number, rand: () => number = Math.random): SnakeState {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const body: Cell[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  const s: SnakeState = { cols, rows, body, dir: "right", pendingDir: "right", food: { x: 0, y: 0 }, score: 0, dead: false };
  s.food = spawnFood(s, rand);
  return s;
}

/** Pick a uniformly random free cell for new food (returns the old food if the board is full). */
export function spawnFood(s: SnakeState, rand: () => number = Math.random): Cell {
  const occupied = new Set(s.body.map((c) => c.y * s.cols + c.x));
  const free: number[] = [];
  for (let i = 0; i < s.cols * s.rows; i++) if (!occupied.has(i)) free.push(i);
  if (free.length === 0) return s.food;
  const idx = free[Math.floor(rand() * free.length)];
  return { x: idx % s.cols, y: Math.floor(idx / s.cols) };
}

/** Queue a turn. Ignores reversals onto the snake's own neck (relative to the queued direction). */
export function turn(s: SnakeState, dir: Dir): void {
  if (dir === OPPOSITE[s.pendingDir]) return;
  s.pendingDir = dir;
}

/** Advance one tick. Mutates `s` and returns the events that occurred this tick. */
export function stepSnake(s: SnakeState, rand: () => number = Math.random): SnakeEvent[] {
  if (s.dead) return [];
  s.dir = s.pendingDir;
  const d = DELTA[s.dir];
  const head = s.body[0];
  const nx = head.x + d.x;
  const ny = head.y + d.y;

  // walls are fatal
  if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) {
    s.dead = true;
    return ["die"];
  }

  // the tail cell vacates this tick (unless we're about to grow), so it's safe to enter
  const eating = nx === s.food.x && ny === s.food.y;
  const bodyToCheck = eating ? s.body : s.body.slice(0, s.body.length - 1);
  if (bodyToCheck.some((c) => c.x === nx && c.y === ny)) {
    s.dead = true;
    return ["die"];
  }

  s.body.unshift({ x: nx, y: ny });
  if (eating) {
    s.score += 1;
    s.food = spawnFood(s, rand);
    return ["eat"];
  }
  s.body.pop();
  return [];
}
