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
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      particles = seedParticles(particleCount(density, W, H), W, H);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.66, H * 0.5, 0, W * 0.66, H * 0.5, Math.max(W, H) * 0.5);
      g.addColorStop(0, "rgba(124,92,255,0.10)");
      g.addColorStop(0.5, "rgba(34,211,238,0.04)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const R = 180 * dpr;
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.base * tw})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
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
        loop();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (animate) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      loop();
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
