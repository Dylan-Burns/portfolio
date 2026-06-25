"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { PongGame } from "./PongGame";
import { SnakeGame } from "./SnakeGame";

type Rect = { top: number; left: number; width: number; height: number };

/** Renders the active game in a fixed overlay aligned to the (zoomed) CRT glass. Living
 *  outside the machine's zoom transform keeps the canvas crisp at the real on-screen size,
 *  rather than a tiny bitmap scaled up ~6x. Games launch only while fully zoomed, so a
 *  measure-on-mount (plus a resize listener) keeps it aligned. */
export function GameLayer({
  glassRef,
  game,
  onQuit,
}: {
  glassRef: RefObject<HTMLDivElement | null>;
  game: "pong" | "snake";
  onQuit: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // GameLayer only mounts client-side (after a launch), so a lazy initializer is safe
  const [isTouch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    const measure = () => {
      const el = glassRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    // pull focus off the still-focused games-list button so Space/Enter during play
    // can't re-activate it through to the launcher
    rootRef.current?.focus();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [glassRef]);

  if (!rect) return null;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="crt-screen-fx game-in fixed z-[60] touch-none overflow-hidden bg-[#020402] outline-none"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: Math.max(4, rect.width * 0.012) }}
    >
      {game === "pong" ? (
        <PongGame width={rect.width} height={rect.height} isTouch={isTouch} onQuit={onQuit} />
      ) : (
        <SnakeGame width={rect.width} height={rect.height} isTouch={isTouch} onQuit={onQuit} />
      )}
    </div>
  );
}
