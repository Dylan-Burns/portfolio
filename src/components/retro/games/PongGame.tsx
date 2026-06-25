"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initPong, stepPong, type PongState } from "./pong-engine";
import { useRafLoop } from "./useRafLoop";
import { GameChrome, type GameStatus } from "./GameChrome";
import { isMuted, setMuted, sfx } from "./beep";
import { getCount, incCount } from "./highscores";

const GREEN = "#7bf0a6";
const DIM = "#2c6b45";

export function PongGame({ width, height, isTouch, onQuit }: { width: number; height: number; isTouch: boolean; onQuit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sRef = useRef<PongState | null>(null);
  const keys = useRef({ up: false, down: false });
  const drag = useRef<{ active: boolean; y: number }>({ active: false, y: 0 });

  const [status, setStatus] = useState<GameStatus>("playing");
  const statusRef = useRef<GameStatus>("playing");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [scores, setScores] = useState({ p: 0, a: 0 });
  // safe as lazy initializers: this component only mounts client-side (after a game is
  // launched), so there's no SSR pass to mismatch against
  const [wins, setWins] = useState(() => getCount("pong.wins"));
  const [muted, setMutedState] = useState(() => isMuted());

  const reset = useCallback(() => {
    sRef.current = initPong(width, height, 7);
    drag.current = { active: false, y: 0 }; // don't carry a stuck drag into the new game
    setScores({ p: 0, a: 0 });
    setStatus("playing");
    sfx.start();
  }, [width, height]);

  // (re)create the canvas backing store + engine whenever the screen size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sRef.current = initPong(width, height, 7);
    setScores({ p: 0, a: 0 });
    setStatus("playing");
  }, [width, height]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const s = sRef.current;
    if (!ctx || !s) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#020402";
    ctx.fillRect(0, 0, width, height);

    // center net
    ctx.strokeStyle = DIM;
    ctx.lineWidth = Math.max(1, width * 0.004);
    ctx.setLineDash([height * 0.03, height * 0.03]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // scores
    ctx.fillStyle = DIM;
    ctx.font = `${Math.round(height * 0.18)}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(s.pScore), width * 0.32, height * 0.08);
    ctx.fillText(String(s.aScore), width * 0.68, height * 0.08);

    ctx.save();
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = Math.max(4, height * 0.03);
    ctx.fillStyle = GREEN;
    // paddles
    ctx.fillRect(0, s.py, s.pw, s.ph);
    ctx.fillRect(width - s.pw, s.ay, s.pw, s.ph);
    // ball (hidden while waiting to serve)
    if (!s.serving) {
      ctx.beginPath();
      ctx.arc(s.bx, s.by, s.br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // "READY" while the serve timer counts down, so the wait reads as intentional
    if (s.serving && !s.over) {
      ctx.fillStyle = DIM;
      ctx.font = `${Math.round(height * 0.07)}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("READY", width / 2, height * 0.62);
    }
  }, [width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  // simulation tick
  useRafLoop(
    useCallback(
      (dt: number) => {
        const s = sRef.current;
        if (!s) return;
        // player paddle: drag wins over keyboard when active
        if (drag.current.active) {
          s.py = Math.max(0, Math.min(height - s.ph, drag.current.y - s.ph / 2));
        } else {
          const v = height * 0.0022 * dt;
          if (keys.current.up) s.py -= v;
          if (keys.current.down) s.py += v;
          s.py = Math.max(0, Math.min(height - s.ph, s.py));
        }

        const events = stepPong(s, dt);
        for (const e of events) {
          if (e === "paddle") sfx.paddle();
          else if (e === "wall") sfx.wall();
          else if (e === "score") {
            sfx.score();
            setScores({ p: s.pScore, a: s.aScore });
          }
        }
        if (s.over && statusRef.current === "playing") {
          const playerWon = s.pScore > s.aScore;
          if (playerWon) setWins(incCount("pong.wins"));
          (playerWon ? sfx.start : sfx.die)();
          setStatus("over");
        }
        draw();
      },
      [draw, height],
    ),
    status === "playing",
  );

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", " ", "p", "r"].includes(k) || e.key === "Escape") e.preventDefault();
      if (k === "arrowup" || k === "w") keys.current.up = true;
      else if (k === "arrowdown" || k === "s") keys.current.down = true;
      else if (k === "p") setStatus((st) => (st === "playing" ? "paused" : st === "paused" ? "playing" : st));
      else if (e.key === "Escape") {
        if (statusRef.current === "playing") setStatus("paused");
        else onQuit();
      } else if (k === "r" && statusRef.current === "over") reset();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keys.current.up = false;
      else if (k === "arrowdown" || k === "s") keys.current.down = false;
    };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, [onQuit, reset]);

  const onCanvasDown = (e: React.PointerEvent) => {
    if (statusRef.current !== "playing") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) drag.current = { active: true, y: e.clientY - rect.top };
  };
  const onCanvasMove = (e: React.PointerEvent) => {
    if (!drag.current.active || statusRef.current !== "playing") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) drag.current = { active: true, y: e.clientY - rect.top };
  };
  const onCanvasUp = () => {
    drag.current.active = false;
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.select();
  };

  const stat =
    status === "over"
      ? `${scores.p > scores.a ? "you win" : "cpu wins"}  ·  wins ${wins}`
      : `YOU ${scores.p} : ${scores.a} CPU`;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerLeave={onCanvasUp}
      />
      <GameChrome
        title="pong.exe"
        stat={stat}
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
