"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ramp, seedStars, starCount, stepStar, type Star } from "./warp-field";

type WarpCtx = { play: (href: string) => void };
const Ctx = createContext<WarpCtx>({ play: () => {} });
export const useWarp = () => useContext(Ctx);

const DUR = 2200;

export function WarpProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const rafRef = useRef(0);

  const play = useCallback((href: string) => {
    if (reduce) { router.push(href); return; }
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) { router.push(href); return; }
    setActive(true);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = Math.floor(innerWidth * dpr));
    const H = (canvas.height = Math.floor(innerHeight * dpr));
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    const cx = W / 2, cy = H / 2;
    const stars: Star[] = seedStars(starCount(W, H, dpr), W, H);
    let pushed = false;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR), e = ramp(t);
      const speed = 4 + e * 340, fov = 1 + e * 1.15;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0,0,0,${0.34 - e * 0.28})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
      for (const s of stars) {
        if (stepStar(s, speed, W, H)) continue; // respawned this frame → skip drawing (pz=0)
        const sx = cx + (s.x / s.z) * W * fov, sy = cy + (s.y / s.z) * H * fov;
        const px = cx + (s.x / s.pz) * W * fov, py = cy + (s.y / s.pz) * H * fov;
        const k = 1 - s.z / W;
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, (0.12 + k * 0.95) * s.b)})`;
        ctx.lineWidth = Math.max(dpr * 0.5, k * k * 3.4 * dpr);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      if (!pushed && t > 0.62) { pushed = true; router.push(href); } // cover moment
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); setActive(false); }
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [reduce, router]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <Ctx.Provider value={{ play }}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300"
        style={{ opacity: active ? 1 : 0 }}
      />
    </Ctx.Provider>
  );
}
