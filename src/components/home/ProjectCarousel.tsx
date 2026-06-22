"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { EASE_OUT } from "@/components/motion/motion-config";
import { cn } from "@/lib/cn";
import type { Project } from "@/content/projects.types";
import { ProjectCardBody } from "./ProjectCardBody";

/** Past this many px (or velocity) a drag commits to the next/previous project. */
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 400;

/**
 * Spotlight carousel for the "Selected work" section. One project sits centered and
 * in focus; its neighbors peek in from the sides, dimmed and scaled back. Clicking a
 * side card (or an arrow, dot, drag, or arrow key) slides it into the spotlight. Only
 * the centered card links out to its case study. On narrow screens it collapses to a
 * single full-width card you swipe between.
 */
export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const draggedRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const labelId = useId();

  const clamp = useCallback((i: number) => Math.max(0, Math.min(projects.length - 1, i)), [projects.length]);
  const goTo = useCallback((i: number) => setIndex(clamp(i)), [clamp]);

  // Center the active card by measuring its real layout position — works for any
  // responsive card width without hardcoding sizes.
  const recalc = useCallback(() => {
    const stage = stageRef.current;
    const card = cardRefs.current[index];
    if (!stage || !card) return;
    setOffset(stage.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2));
  }, [index]);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  function onDragEnd(_e: unknown, info: PanInfo) {
    draggedRef.current = Math.abs(info.offset.x) > 6;
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) goTo(index + 1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) goTo(index - 1);
    // Otherwise the `animate` target snaps the track back to the current card.
  }

  const atStart = index === 0;
  const atEnd = index === projects.length - 1;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      className="mt-10"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(index + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index - 1);
        }
      }}
    >
      <span id={labelId} className="sr-only">
        Selected work — {index + 1} of {projects.length}: {projects[index]?.name}
      </span>

      <div
        ref={stageRef}
        className="relative overflow-hidden sm:w-screen sm:-mx-[calc(50vw-50%)] sm:[mask-image:linear-gradient(to_right,transparent,#000_18%,#000_82%,transparent)] sm:[-webkit-mask-image:linear-gradient(to_right,transparent,#000_18%,#000_82%,transparent)]"
      >
        <motion.div
          className="flex items-center gap-5 md:gap-7"
          animate={{ x: offset }}
          transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragStart={() => {
            draggedRef.current = false;
          }}
          onDragEnd={onDragEnd}
        >
          {projects.map((project, i) => {
            const active = i === index;
            const card = <ProjectCardBody project={project} active={active} />;
            return (
              <div
                key={project.slug}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={cn(
                  "shrink-0 basis-full sm:basis-[clamp(20rem,68vw,38rem)]",
                  "transition-[transform,opacity,filter] duration-500",
                  active ? "scale-100 opacity-100" : "scale-[0.86] opacity-40 saturate-[0.7]",
                )}
              >
                {active ? (
                  <Link
                    href={`/work/${project.slug}`}
                    aria-label={`${project.name} — view case study`}
                    className="block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    onClick={(e) => {
                      // A swipe shouldn't navigate — only a genuine tap should.
                      if (draggedRef.current) e.preventDefault();
                    }}
                    draggable={false}
                  >
                    {card}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-label={`Show ${project.name}`}
                    onClick={() => {
                      if (!draggedRef.current) goTo(i);
                    }}
                    className="block w-full cursor-pointer rounded-[var(--radius-card)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    tabIndex={-1}
                  >
                    {card}
                  </button>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={atStart}
          aria-label="Previous project"
          className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-lg text-[var(--color-fg)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          ←
        </button>

        <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose a project">
          {projects.map((project, i) => (
            <button
              key={project.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to ${project.name}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                i === index ? "w-6 bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-accent-3))]" : "w-2 bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.3)]",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={atEnd}
          aria-label="Next project"
          className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-lg text-[var(--color-fg)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          →
        </button>
      </div>
    </div>
  );
}
