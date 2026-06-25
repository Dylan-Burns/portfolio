import { useEffect, useRef } from "react";

/** Runs `cb(dtMs)` each animation frame while `running` is true. dt is clamped so a
 *  backgrounded tab doesn't resume with a huge jump. The callback can change every
 *  render without restarting the loop (kept in a ref). */
export function useRafLoop(cb: (dtMs: number) => void, running: boolean): void {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = -1; // cold start: the first frame (and the first frame after a pause) gets a nominal dt
    const loop = (t: number) => {
      const dt = last < 0 ? 16 : Math.min(50, t - last);
      last = t;
      cbRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
