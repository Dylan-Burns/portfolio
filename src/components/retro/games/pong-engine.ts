/** Pure, DOM-free Pong simulation. Unit-tested in node (see tests/unit/pong-engine.test.ts).
 *  Single player (left) vs. a capped-speed AI (right); first to `winScore` wins.
 *  All positions/velocities are in field units (the component uses CSS px); dt is in ms.
 *  The component owns the player paddle (`py`); the engine moves the ball and the AI. */

export type PongState = {
  w: number;
  h: number;
  bx: number;
  by: number;
  bvx: number;
  bvy: number;
  br: number; // ball radius
  pw: number; // paddle width
  ph: number; // paddle height
  py: number; // player paddle top (left side)
  ay: number; // ai paddle top (right side)
  pScore: number;
  aScore: number;
  serving: boolean;
  serveTimer: number; // ms until the ball launches
  serveDir: 1 | -1; // +1 launches toward the AI, -1 toward the player
  winScore: number;
  over: boolean;
};

export type PongEvent = "paddle" | "wall" | "score";

const MAX_ANGLE = 0.92; // radians off the horizontal a paddle hit can impart
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const baseSpeed = (s: PongState) => Math.hypot(s.w, s.h) * 0.00045;
const maxSpeed = (s: PongState) => Math.hypot(s.w, s.h) * 0.0011;

export function initPong(w: number, h: number, winScore = 7, rand: () => number = Math.random): PongState {
  const ph = h * 0.18;
  const pw = Math.max(4, w * 0.022);
  const s: PongState = {
    w,
    h,
    bx: w / 2,
    by: h / 2,
    bvx: 0,
    bvy: 0,
    br: Math.max(3, h * 0.018),
    pw,
    ph,
    py: (h - ph) / 2,
    ay: (h - ph) / 2,
    pScore: 0,
    aScore: 0,
    serving: true,
    serveTimer: 900,
    serveDir: rand() < 0.5 ? 1 : -1,
    winScore,
    over: false,
  };
  return s;
}

function launch(s: PongState, rand: () => number): void {
  s.serving = false;
  const speed = baseSpeed(s);
  const angle = (rand() * 2 - 1) * 0.5;
  s.bvx = s.serveDir * Math.abs(Math.cos(angle)) * speed;
  s.bvy = Math.sin(angle) * speed;
}

function resetServe(s: PongState, dir: 1 | -1): void {
  s.bx = s.w / 2;
  s.by = s.h / 2;
  s.bvx = 0;
  s.bvy = 0;
  s.serving = true;
  s.serveTimer = 700;
  s.serveDir = dir;
}

function moveAi(s: PongState, dt: number): void {
  const speed = s.h * 0.0012 * dt; // capped below the ball's top speed, so sharp angles beat it
  const target = s.bvx > 0 ? s.by - s.ph / 2 : (s.h - s.ph) / 2;
  const diff = target - s.ay;
  // deadzone: don't micro-correct — leaves the AI a beat behind on fast, steep returns
  if (Math.abs(diff) < s.ph * 0.16) return;
  s.ay = clamp(s.ay + clamp(diff, -speed, speed), 0, s.h - s.ph);
}

/** Reflect the ball off a paddle, adding "english" from the contact point and a slight speed-up.
 *  `dir` is the post-bounce horizontal sign (+1 = toward AI, -1 = toward player). */
function bouncePaddle(s: PongState, paddleTop: number, dir: 1 | -1): void {
  const rel = clamp((s.by - (paddleTop + s.ph / 2)) / (s.ph / 2), -1, 1);
  const speed = Math.min(Math.hypot(s.bvx, s.bvy) * 1.06, maxSpeed(s));
  const angle = rel * MAX_ANGLE;
  s.bvx = dir * Math.abs(Math.cos(angle)) * speed;
  s.bvy = Math.sin(angle) * speed;
}

/** Advance the simulation by `dt` ms. Mutates `s`; returns the events that occurred. */
export function stepPong(s: PongState, dt: number, rand: () => number = Math.random): PongEvent[] {
  if (s.over) return [];
  moveAi(s, dt);

  if (s.serving) {
    s.bx = s.w / 2;
    s.by = s.h / 2;
    s.serveTimer -= dt;
    if (s.serveTimer <= 0) launch(s, rand);
    return [];
  }

  const ev: PongEvent[] = [];
  s.bx += s.bvx * dt;
  s.by += s.bvy * dt;

  // top / bottom walls
  if (s.by - s.br < 0) {
    s.by = s.br;
    s.bvy = Math.abs(s.bvy);
    ev.push("wall");
  } else if (s.by + s.br > s.h) {
    s.by = s.h - s.br;
    s.bvy = -Math.abs(s.bvy);
    ev.push("wall");
  }

  // player paddle (left)
  if (s.bvx < 0 && s.bx - s.br <= s.pw && s.bx > 0 && s.by >= s.py && s.by <= s.py + s.ph) {
    bouncePaddle(s, s.py, 1);
    s.bx = s.pw + s.br;
    ev.push("paddle");
  }
  // ai paddle (right)
  else if (s.bvx > 0 && s.bx + s.br >= s.w - s.pw && s.bx < s.w && s.by >= s.ay && s.by <= s.ay + s.ph) {
    bouncePaddle(s, s.ay, -1);
    s.bx = s.w - s.pw - s.br;
    ev.push("paddle");
  }

  // scoring
  if (s.bx + s.br < 0) {
    s.aScore += 1;
    ev.push("score");
    if (s.aScore >= s.winScore) s.over = true;
    else resetServe(s, -1);
  } else if (s.bx - s.br > s.w) {
    s.pScore += 1;
    ev.push("score");
    if (s.pScore >= s.winScore) s.over = true;
    else resetServe(s, 1);
  }

  return ev;
}
