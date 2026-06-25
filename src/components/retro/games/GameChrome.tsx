"use client";

import type { ReactNode } from "react";

export type GameStatus = "playing" | "paused" | "over";

/** Speaker icon — with sound waves when on, with an "x" when muted. Inherits currentColor. */
function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      {muted ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 6a9 9 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}

/** Pause/play toggle — pause bars while playing, a play triangle while paused. Inherits currentColor. */
function PlayPauseIcon({ paused }: { paused: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {paused ? (
        <path d="M8 5v14l11-7z" />
      ) : (
        <>
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </>
      )}
    </svg>
  );
}

/** Presentational frame shared by both games: a slim status line across the top, and a
 *  centered overlay for the paused / game-over states. Sits above the game canvas; only
 *  the buttons capture pointer events so the canvas stays draggable underneath. */
export function GameChrome({
  title,
  stat,
  status,
  muted,
  isTouch,
  onToggleMute,
  onPause,
  onResume,
  onRetry,
  onQuit,
  children,
}: {
  title: string;
  stat: string; // e.g. "SCORE 12 · HI 40" or "YOU 3 : 5 CPU"
  status: GameStatus;
  muted: boolean;
  isTouch: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetry: () => void;
  onQuit: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="crt-term pointer-events-none absolute inset-0 select-none">
      <div className="flex items-center justify-between px-3 pt-2 text-[12px] tracking-tight">
        <span className="opacity-90">{title}</span>
        <span className="opacity-90">{stat}</span>
        <span className="pointer-events-auto flex gap-1.5">
          <button className="crt-btn inline-flex items-center justify-center" onClick={onToggleMute} aria-label={muted ? "unmute" : "mute"}>
            <SoundIcon muted={muted} />
          </button>
          {status !== "over" && (
            <button
              className="crt-btn inline-flex items-center justify-center"
              onClick={status === "playing" ? onPause : onResume}
              aria-label={status === "playing" ? "pause" : "resume"}
            >
              <PlayPauseIcon paused={status === "paused"} />
            </button>
          )}
          <button className="crt-btn" onClick={onQuit} aria-label="quit game">
            quit
          </button>
        </span>
      </div>

      {status !== "playing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-center">
          {status === "paused" ? (
            <>
              <div className="text-[clamp(16px,4vw,26px)] tracking-[0.18em]">PAUSED</div>
              <div className="text-xs opacity-75">{isTouch ? "tap resume" : "P — resume   ·   Esc — quit"}</div>
              <div className="pointer-events-auto flex gap-2.5">
                <button className="crt-btn" onClick={onResume}>
                  resume
                </button>
                <button className="crt-btn" onClick={onQuit}>
                  quit
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-[clamp(16px,4vw,26px)] tracking-[0.18em]">GAME OVER</div>
              <div className="text-sm opacity-90">{stat}</div>
              <div className="text-xs opacity-75">{isTouch ? "" : "R — retry   ·   Esc — quit"}</div>
              <div className="pointer-events-auto flex gap-2.5">
                <button className="crt-btn" onClick={onRetry}>
                  retry
                </button>
                <button className="crt-btn" onClick={onQuit}>
                  quit
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
