"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initSnake, stepSnake, turn, type Dir, type SnakeState } from "./snake-engine";
import { useRafLoop } from "./useRafLoop";
import { GameChrome, type GameStatus } from "./GameChrome";
import { isMuted, setMuted, sfx } from "./beep";
import { getHighScore, setHighScore } from "./highscores";

const COLS = 22;
const BODY = "#5fcf86";
const HEAD = "#c9ffe0";
const FOOD = "#a6ffcb";
const GRID = "rgba(100,240,160,.06)";

const tickInterval = (score: number) => Math.max(60, 132 - score * 4);

export function SnakeGame({ width, height, isTouch, onQuit }: { width: number; height: number; isTouch: boolean; onQuit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sRef = useRef<SnakeState | null>(null);
  const acc = useRef(0); // ms accumulated toward the next tick
  const pulse = useRef(0); // food pulse phase
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const cell = width / COLS;
  const rows = Math.max(8, Math.floor(height / cell));
  const offY = (height - rows * cell) / 2;

  const [status, setStatus] = useState<GameStatus>("playing");
  const statusRef = useRef<GameStatus>("playing");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [score, setScore] = useState(0);
  // safe as lazy initializers: this component only mounts client-side (after a game is
  // launched), so there's no SSR pass to mismatch against
  const [hi, setHi] = useState(() => getHighScore("snake"));
  const [muted, setMutedState] = useState(() => isMuted());

  const reset = useCallback(() => {
    sRef.current = initSnake(COLS, rows);
    acc.current = 0;
    setScore(0);
    setStatus("playing");
    sfx.start();
  }, [rows]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const s = sRef.current;
    if (!ctx || !s) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#020402";
    ctx.fillRect(0, 0, width, height);

    // faint grid
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, offY);
      ctx.lineTo(x * cell, offY + rows * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, offY + y * cell);
      ctx.lineTo(width, offY + y * cell);
      ctx.stroke();
    }

    const pad = cell * 0.12;
    const r = cell * 0.22;
    const size = cell - pad * 2;
    const roundRect = (cx: number, cy: number) => {
      const x = cx * cell + pad;
      const y = offY + cy * cell + pad;
      ctx.beginPath();
      // roundRect is baseline-modern but absent on older engines — fall back to a plain rect
      if (ctx.roundRect) ctx.roundRect(x, y, size, size, r);
      else ctx.rect(x, y, size, size);
      ctx.fill();
    };

    ctx.save();
    ctx.shadowColor = BODY;
    ctx.shadowBlur = Math.max(3, cell * 0.35);
    s.body.forEach((c, i) => {
      ctx.fillStyle = i === 0 ? HEAD : BODY;
      roundRect(c.x, c.y);
    });

    // food pulses gently
    const k = 0.78 + Math.sin(pulse.current * 0.006) * 0.16;
    ctx.fillStyle = FOOD;
    ctx.shadowColor = FOOD;
    ctx.beginPath();
    ctx.arc(s.food.x * cell + cell / 2, offY + s.food.y * cell + cell / 2, (cell / 2 - pad) * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [width, height, cell, rows, offY]);

  // (re)create canvas + engine on size change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sRef.current = initSnake(COLS, rows);
    acc.current = 0;
    setScore(0);
    setStatus("playing");
  }, [width, height, rows]);

  useEffect(() => {
    draw();
  }, [draw]);

  useRafLoop(
    useCallback(
      (dt: number) => {
        const s = sRef.current;
        if (!s) return;
        pulse.current += dt;
        acc.current += dt;
        const interval = tickInterval(s.score);
        while (acc.current >= interval && !s.dead) {
          acc.current -= interval;
          const events = stepSnake(s);
          if (events.includes("eat")) {
            sfx.eat();
            setScore(s.score);
          }
          if (events.includes("die")) {
            sfx.die();
            setHi(setHighScore("snake", s.score));
            setStatus("over");
          }
        }
        draw();
      },
      [draw],
    ),
    status === "playing",
  );

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = sRef.current;
      const k = e.key.toLowerCase();
      const dirs: Record<string, Dir> = {
        arrowup: "up", w: "up", arrowdown: "down", s: "down",
        arrowleft: "left", a: "left", arrowright: "right", d: "right",
      };
      if (k in dirs || ["p", "r", " "].includes(k) || e.key === "Escape") e.preventDefault();
      if (s && k in dirs && statusRef.current === "playing") turn(s, dirs[k]);
      else if (k === "p") setStatus((st) => (st === "playing" ? "paused" : st === "paused" ? "playing" : st));
      else if (e.key === "Escape") {
        if (statusRef.current === "playing") setStatus("paused");
        else onQuit();
      } else if (k === "r" && statusRef.current === "over") reset();
    };
    addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  }, [onQuit, reset]);

  // touch: swipe to turn (chained — resets the origin after each registered swipe)
  const onDown = (e: React.PointerEvent) => {
    if (statusRef.current === "playing") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = sRef.current;
    if (!swipe.current || !s || statusRef.current !== "playing") return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    const threshold = Math.max(18, cell * 0.6);
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    turn(s, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    swipe.current = null;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.select();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <GameChrome
        title="snake.exe"
        stat={`SCORE ${score} · HI ${hi}`}
        status={status}
        muted={muted}
        isTouch={isTouch}
        onToggleMute={toggleMute}
        onPause={() => setStatus("paused")}
        onResume={() => setStatus("playing")}
        onRetry={reset}
        onQuit={onQuit}
      />
    </>
  );
}
