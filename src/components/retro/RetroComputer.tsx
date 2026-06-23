"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CUTOUT, IMAGE_ASPECT, TERM_LOGICAL_WIDTH, ZOOM } from "./cutout";
import { CrtScreen } from "./CrtScreen";
import { IntroOverlay } from "./IntroOverlay";
import { Legend } from "./Legend";
import { TransitionLink } from "./TransitionLink";
import { useWarp } from "./WarpOverlay";
import type { FileItem } from "@/content/file-items";

export function RetroComputer({ items }: { items: FileItem[] }) {
  const [intro, setIntro] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [sel, setSel] = useState(0);
  const crtRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const { play } = useWarp();

  // Scale the fixed-width terminal to fit the cutout. Use offsetWidth (layout width),
  // NOT getBoundingClientRect (which includes the live zoom transform) — otherwise a
  // measurement taken mid zoom-out locks in a too-big scale and the screen never resets.
  // The term is a child of the zoom wrapper, so it scales with the wrapper automatically;
  // this scale is the constant unzoomed fit and is correct at every zoom level.
  const fitTerm = useCallback(() => {
    const crt = crtRef.current, term = termRef.current;
    if (!crt || !term) return;
    term.style.transform = `scale(${crt.offsetWidth / TERM_LOGICAL_WIDTH})`;
  }, []);
  useEffect(() => { fitTerm(); addEventListener("resize", fitTerm); return () => removeEventListener("resize", fitTerm); }, [fitTerm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (intro) return; // intro handles its own Enter via overlay click/keyboard? keep simple: ignore
      if (e.key === "Escape") { if (zoomed) setZoomed(false); return; }
      if (!zoomed) { if (e.key === "Enter") { e.preventDefault(); setZoomed(true); } return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % items.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + items.length) % items.length); }
      else if (e.key === "Enter") {
        // if a CRT file link is focused, its native activation already triggers the warp
        if ((document.activeElement as HTMLElement | null)?.closest(".crt-file")) return;
        e.preventDefault();
        play(items[sel].href);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [intro, zoomed, sel, items, play]);

  // when zooming in, move focus to the selected file so keyboard users land on the active list
  useEffect(() => {
    if (!zoomed) return;
    (document.querySelector(`[data-crt-index="${sel}"]`) as HTMLElement | null)?.focus();
  }, [zoomed, sel]);

  const zoomStyle = zoomed
    ? { transform: `translate(${ZOOM.translateX}%, ${ZOOM.translateY}%) scale(${ZOOM.scale})` }
    : undefined;

  return (
    <main
      className="relative flex h-dvh items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#cecac7 38%,#ddd9d6 68%,#ece9e6 100%)" }}
    >
      {intro && <IntroOverlay onDone={() => setIntro(false)} />}

      <div
        className="relative transition-transform duration-[1150ms] [transition-timing-function:cubic-bezier(.7,0,.18,1)]"
        style={{ width: "max(100vw, calc(100vh * 1536 / 1024))", aspectRatio: IMAGE_ASPECT, transformOrigin: `${ZOOM.originX}% ${ZOOM.originY}%`, ...zoomStyle }}
      >
        <Image src="/retro/machine.png" alt="A vintage micro-computer on a plinth" fill priority sizes="100vw" className="object-cover select-none" />
        <div
          ref={crtRef}
          className="crt-glass absolute cursor-pointer overflow-hidden rounded-[14px/11px] bg-[#020402]"
          style={{ left: `${CUTOUT.left}%`, top: `${CUTOUT.top}%`, width: `${CUTOUT.width}%`, height: `${CUTOUT.height}%` }}
          onClick={() => !zoomed && setZoomed(true)}
        >
          <div ref={termRef} className="absolute left-0 top-0 origin-top-left pl-[22px] pr-[46px] pt-[24px] pb-[16px]">
            <CrtScreen
              items={items}
              selected={sel}
              onHover={(i) => zoomed && setSel(i)}
              renderItem={(it, i, selected) => (
                <TransitionLink href={it.href} tabIndex={zoomed ? 0 : -1} data-crt-index={i}
                  className={`crt-file ${selected ? "sel" : ""}`} aria-label={`Open ${it.name}`}>
                  <span className="pre">&gt;</span><span className="nm">{it.label}</span><span className="cmt">{it.comment}</span>
                </TransitionLink>
              )}
            />
          </div>
        </div>
      </div>

      {!intro && (
        <>
          <Legend zoomed={zoomed} />
          {zoomed && (
            <button onClick={() => setZoomed(false)}
              className="fixed left-[18px] top-[18px] z-40 rounded-md border border-[#aaa] bg-white/80 px-3 py-[7px] font-[family-name:var(--font-mono)] text-xs text-[#234]">
              ← back out
            </button>
          )}
        </>
      )}
    </main>
  );
}
