"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  particleCount,
  repelDelta,
  seedParticles,
  shouldAnimate,
  type Density,
  type Particle,
} from "./particle-field";

/**
 * Fixed, decorative, full-viewport particle field behind all content. White dust
 * forms a soft nebula cluster + gradient glow; particles repel from the cursor and
 * drift back. Renders a single static frame (no rAF, no pointer listeners) under
 * reduced motion or on coarse-pointer (touch) devices. Replaces GlowBackdrop.
 */
export function ParticleField({
  density = "med",
  interaction = "repel",
}: {
  density?: Density;
  interaction?: "repel" | "attract";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finePointer =
      typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
    const animate = shouldAnimate({ reduceMotion: !!reduce, finePointer });
    const dir = interaction === "repel" ? 1 : -1;

    let dpr = 1, W = 0, H = 0;
    let particles: Particle[] = [];
    let gradient: CanvasGradient | null = null;
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = true;

    // Cap to ~30fps — the field drifts slowly, so this is visually identical to
    // 60/120Hz but roughly halves (or more) the per-frame canvas work.
    const FRAME_MS = 1000 / 30;
    let lastFrame = 0;

    // Quantize particle opacity into a handful of buckets so we can fill all
    // particles of a similar alpha in one path, instead of one fillStyle string
    // + one fill() per particle per frame.
    const NUM_BUCKETS = 16;
    const buckets: Particle[][] = Array.from({ length: NUM_BUCKETS }, () => []);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      particles = seedParticles(particleCount(density, W, H), W, H);
      // Gradient never changes between frames — build it once per resize.
      gradient = ctx.createRadialGradient(W * 0.66, H * 0.5, 0, W * 0.66, H * 0.5, Math.max(W, H) * 0.5);
      gradient.addColorStop(0, "rgba(124,92,255,0.10)");
      gradient.addColorStop(0.5, "rgba(34,211,238,0.04)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (gradient) {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);
      }

      const R = 180 * dpr;
      for (let b = 0; b < NUM_BUCKETS; b++) buckets[b].length = 0;

      for (const p of particles) {
        if (animate) {
          p.vx += (p.ox - p.x) * 0.004;
          p.vy += (p.oy - p.y) * 0.004;
          if (mouse.active) {
            const { fx, fy } = repelDelta(p.x, p.y, mouse.x * dpr, mouse.y * dpr, R, p.depth);
            p.vx += dir * fx;
            p.vy += dir * fy;
          }
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
          p.tw += p.tws;
        }
        const tw = animate ? Math.sin(p.tw) * 0.35 + 0.65 : 0.85;
        const alpha = p.base * tw;
        if (alpha <= 0) continue;
        let bi = (alpha * NUM_BUCKETS) | 0;
        if (bi >= NUM_BUCKETS) bi = NUM_BUCKETS - 1;
        buckets[bi].push(p);
      }

      // One fillStyle + one fill() per non-empty alpha bucket (≤16) rather than
      // per particle (≤700).
      ctx.fillStyle = "#fff";
      const TWO_PI = Math.PI * 2;
      for (let b = 0; b < NUM_BUCKETS; b++) {
        const list = buckets[b];
        if (list.length === 0) continue;
        ctx.globalAlpha = (b + 0.5) / NUM_BUCKETS;
        ctx.beginPath();
        for (const p of list) {
          const r = p.size * dpr;
          ctx.moveTo(p.x + r, p.y); // avoid a chord line connecting arcs
          ctx.arc(p.x, p.y, r, 0, TWO_PI);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (t - lastFrame < FRAME_MS) return;
      lastFrame = t;
      draw();
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onVisibility = () => {
      if (!animate) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (animate) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reduce, density, interaction]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
