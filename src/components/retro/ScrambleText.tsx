"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// printable glyphs the characters cycle through mid-spin (kept monospace-width)
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/<>{}[]#%&@$*+=-_.";
const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/**
 * Slot-machine text: when `trigger` changes (and `active`), every non-space character spins
 * through random glyphs and resolves left-to-right to `text`. Keeps the string length constant
 * so the fixed-width CRT layout never shifts. No spin on first mount or under reduced motion.
 */
export function ScrambleText({
  text,
  trigger,
  active = true,
  className,
}: {
  text: string;
  trigger: number;
  active?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const rafRef = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    // resting state: show the final text with no spin (first mount, reduced motion, or the selected line).
    if (first.current) {
      first.current = false;
      setDisplay(text);
      return;
    }
    if (!active || reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(text);
      return;
    }
    const len = text.length;
    const DURATION = 720;
    // each position locks in at a staggered moment so the line resolves left-to-right
    const lockAt = Array.from({ length: len }, (_, i) => DURATION * 0.2 + (i / Math.max(1, len)) * DURATION * 0.6);
    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      let out = "";
      let done = true;
      for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (ch === " ") out += " ";
        else if (t >= lockAt[i]) out += ch;
        else {
          out += rand();
          done = false;
        }
      }
      setDisplay(out);
      if (!done && t < DURATION) rafRef.current = requestAnimationFrame(frame);
      else setDisplay(text);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return <span className={className}>{display}</span>;
}
