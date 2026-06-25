"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { BrowserFrame } from "./BrowserFrame";
import { PhoneFrame } from "./PhoneFrame";
import { cn } from "@/lib/cn";
import type { Project, TourFeature } from "@/content/projects.types";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A single window (browser or phone) with one tab per feature. Switching tabs swaps in
 * that feature's set of views. Navigate with the tabs, the edge/flanking arrows, the dots,
 * ← → keys, or a swipe. When a feature has a single view, the arrows step between features
 * instead (so a set of one-screen features reads as one flat slider). Used when a project
 * defines `tour`.
 */
export function FeatureTour({
  features,
  url,
  name,
  frame = "browser",
}: {
  features: TourFeature[];
  url?: string;
  name: string;
  frame?: Project["frame"];
}) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState(0);
  const [view, setView] = useState(0);
  const isPhone = frame === "phone";

  const feature = features[tab];
  const views = feature.views;
  const count = views.length;
  const active = views[view];
  // arrows/drag are available when there's anywhere to go — more views, or more features
  const canNav = features.length > 1 || count > 1;

  const selectTab = (i: number) => {
    setTab(i);
    setView(0);
  };
  // step within the feature's views; if it's a single-view feature, step between features
  const step = (delta: number) => {
    if (count > 1) {
      setView((view + delta + count) % count);
    } else {
      setTab((tab + delta + features.length) % features.length);
      setView(0);
    }
  };
  const prev = () => step(-1);
  const next = () => step(1);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (!canNav) return;
    if (info.offset.x < -60 || info.velocity.x < -400) next();
    else if (info.offset.x > 60 || info.velocity.x > 400) prev();
  };

  // a stable key so the crossfade re-triggers on tab and view changes
  const slideKey = `${tab}:${view}`;

  const imgEl = (
    <Image
      src={active.src}
      alt={active.alt}
      fill
      sizes={isPhone ? "300px" : "(max-width: 1024px) 100vw, 1024px"}
      draggable={false}
      className={cn("object-cover", !isPhone && "object-top")}
    />
  );

  const media = reduce ? (
    imgEl
  ) : (
    <motion.div
      className={cn("absolute inset-0", canNav && "cursor-grab touch-pan-y active:cursor-grabbing")}
      drag={canNav ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={slideKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {imgEl}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  // Solid (no backdrop-blur — that repaints every frame during the crossfade and flickers),
  // light to read over the white window or the dark page, with a gentle hover lift.
  const arrowBase =
    "grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/85 text-neutral-700 shadow-[0_2px_12px_rgba(0,0,0,0.14)] transition duration-150 ease-out hover:bg-white hover:text-neutral-950 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]";

  return (
    <figure
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name} — feature walkthrough`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-fg)]",
        isPhone && "mx-auto flex max-w-2xl flex-col items-center",
      )}
    >
      {/* feature tabs */}
      <div
        role="tablist"
        aria-label="Features"
        className={cn("mb-3 flex flex-wrap gap-2", isPhone && "justify-center")}
      >
        {features.map((f, i) => (
          <button
            key={f.title}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => selectTab(i)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] transition-colors",
              i === tab
                ? "border-[var(--color-fg)] bg-[var(--color-surface)] text-[var(--color-fg)]"
                : "border-[var(--color-border)] text-[var(--color-fg-subtle)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-muted)]",
            )}
          >
            {f.title}
          </button>
        ))}
      </div>

      {isPhone ? (
        <div className="flex w-full items-center justify-center gap-3 sm:gap-5">
          {canNav && (
            <button type="button" aria-label="Previous screen" onClick={prev} className={cn(arrowBase, "shrink-0")}>
              <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 -translate-x-px" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          )}
          <PhoneFrame className="w-[230px] shrink-0 sm:w-[248px]">
            <div aria-live="polite" className="relative h-full w-full select-none overflow-hidden bg-black">
              {media}
            </div>
          </PhoneFrame>
          {canNav && (
            <button type="button" aria-label="Next screen" onClick={next} className={cn(arrowBase, "shrink-0")}>
              <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 translate-x-px" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <BrowserFrame url={url}>
          <div aria-live="polite" className="relative aspect-[2/1] w-full select-none overflow-hidden bg-white">
            {media}
            {canNav && (
              <>
                <button type="button" aria-label="Previous view" onClick={prev} className={cn(arrowBase, "absolute left-3 top-1/2 z-20 -translate-y-1/2")}>
                  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 -translate-x-px" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button type="button" aria-label="Next view" onClick={next} className={cn(arrowBase, "absolute right-3 top-1/2 z-20 -translate-y-1/2")}>
                  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 translate-x-px" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </BrowserFrame>
      )}

      {/* caption — position indicator + feature overview */}
      <figcaption className={cn("mt-4 flex flex-col gap-2", isPhone && "items-center text-center")}>
        <div className="flex items-center gap-3">
          {count > 1 && (
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Views">
              {views.map((v, i) => (
                <button
                  key={v.src}
                  type="button"
                  role="tab"
                  aria-label={`View ${i + 1}${v.caption ? `: ${v.caption}` : ""}`}
                  aria-selected={i === view}
                  onClick={() => setView(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === view ? "bg-[var(--color-fg)]" : "bg-[var(--color-border-strong)] hover:bg-[var(--color-fg-muted)]",
                  )}
                />
              ))}
            </div>
          )}
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
            {count > 1 ? (
              <>
                {pad(view + 1)} / {pad(count)}
                {active.caption ? <span className="text-[var(--color-fg)]"> · {active.caption}</span> : null}
              </>
            ) : (
              <>
                {pad(tab + 1)} / {pad(features.length)}
                <span className="text-[var(--color-fg)]"> · {feature.title}</span>
              </>
            )}
          </span>
        </div>
        <p className={cn("text-[15px] leading-relaxed text-[var(--color-fg-muted)]", isPhone ? "max-w-md" : "max-w-2xl")}>
          {feature.blurb}
        </p>
      </figcaption>
    </figure>
  );
}

/** Convenience wrapper so callers can pass the whole project. */
export function ProjectFeatureTour({ project, url }: { project: Project; url?: string }) {
  if (!project.tour?.length) return null;
  return <FeatureTour features={project.tour} url={url} name={project.name} frame={project.frame} />;
}
