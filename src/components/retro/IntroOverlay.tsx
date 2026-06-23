"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const L1 = "Hi, I'm Dylan.";
const L2 = "I love to build things";

/** Full-screen intro: types two lines, blinks ~2s each, then dissolves away.
 * Calls onDone when dissolved (parent can then enable the scene). */
export function IntroOverlay({ onDone }: { onDone?: () => void }) {
  const reduce = useReducedMotion();
  const [t1, setT1] = useState(() => (reduce ? L1 : ""));
  const [t2, setT2] = useState(() => (reduce ? L2 : ""));
  const [active2, setActive2] = useState(() => Boolean(reduce));
  const [gone, setGone] = useState(false);
  const doneRef = useRef(false);

  const finish = () => { if (doneRef.current) return; doneRef.current = true; setGone(true); setTimeout(() => onDone?.(), 1000); };

  useEffect(() => {
    if (reduce) { const id = setTimeout(finish, 1200); return () => clearTimeout(id); }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = (text: string, set: (s: string) => void, done: () => void) => {
      let i = 0;
      const step = () => { if (i <= text.length) { set(text.slice(0, i++)); timers.push(setTimeout(step, 30 + Math.random() * 45)); } else timers.push(setTimeout(done, 2000)); };
      step();
    };
    type(L1, setT1, () => { setActive2(true); type(L2, setT2, finish); });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <div
      onClick={finish}
      className={`fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center gap-8 px-6 text-center transition-opacity duration-1000 ${gone ? "pointer-events-none opacity-0" : ""}`}
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#d6d2cf 55%,#ece9e6 100%)" }}
    >
      <div className="text-[clamp(20px,4vw,42px)] leading-[1.3] tracking-tight text-[#1a1a1a]">
        <div className="min-h-[1.3em] whitespace-nowrap">{t1}<span className="hcaret" style={{ visibility: active2 ? "hidden" : "visible" }} /></div>
        <div className="min-h-[1.3em] whitespace-nowrap">{t2}<span className="hcaret" style={{ visibility: active2 ? "visible" : "hidden" }} /></div>
      </div>
    </div>
  );
}
