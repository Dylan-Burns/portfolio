"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CUTOUT_LARGE, IMAGE_ASPECT_LARGE, ZOOM_LARGE, ZOOM_MOBILE } from "./cutout";
import { CrtScreen } from "./CrtScreen";
import { IntroOverlay } from "./IntroOverlay";
import { Legend } from "./Legend";
import { TransitionLink } from "./TransitionLink";
import { ScrambleText } from "./ScrambleText";
import { useIsMobile } from "./useIsMobile";
import { useWarp } from "./WarpOverlay";
import type { FileItem } from "@/content/file-items";

export function RetroComputer({ items, initialZoom = false }: { items: FileItem[]; initialZoom?: boolean }) {
  // deep-linked from a work page (/?view=files): skip the intro and land already zoomed into the file list
  const [intro, setIntro] = useState(!initialZoom);
  const [zoomed, setZoomed] = useState(initialZoom);
  const [sel, setSel] = useState(0);
  // Don't animate the zoom on the first paint: when we land already-zoomed (deep-link from a work
  // page) the mobile/desktop check resolves a beat after mount, nudging the transform — without this
  // gate that nudge plays as a visible 1.15s re-zoom. Enable the transition one frame after mount.
  const [animate, setAnimate] = useState(false);
  const crtRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { play } = useWarp();

  // Scale the fixed-width terminal to fit the cutout. Use offsetWidth (layout width),
  // NOT getBoundingClientRect (which includes the live zoom transform) — otherwise a
  // measurement taken mid zoom-out locks in a too-big scale and the screen never resets.
  // The term is a child of the zoom wrapper, so it scales with the wrapper automatically;
  // this scale is the constant unzoomed fit and is correct at every zoom level.
  const fitTerm = useCallback(() => {
    const crt = crtRef.current, term = termRef.current;
    if (!crt || !term) return;
    // Divide by the term's own natural layout width (offsetWidth, transform-independent)
    // so the fit stays correct no matter the terminal's width/padding.
    term.style.transform = `scale(${crt.offsetWidth / term.offsetWidth})`;
  }, []);
  // re-fit on mount, on resize, and when the breakpoint flips (mobile uses a narrower terminal)
  useEffect(() => { fitTerm(); addEventListener("resize", fitTerm); return () => removeEventListener("resize", fitTerm); }, [fitTerm, isMobile]);

  // turn the zoom transition on after the first frame (see `animate` above)
  useEffect(() => { const id = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(id); }, []);

  // after a deep-link (/?view=files) lands us zoomed, strip the query so the URL is clean and a later
  // fresh visit / reload of "/" plays the intro again instead of being stuck skipping it
  useEffect(() => {
    if (initialZoom && window.location.search) window.history.replaceState(null, "", "/");
  }, [initialZoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (intro) return;
      if (e.key === " ") { e.preventDefault(); setZoomed((z) => !z); return; } // Space toggles zoom in/out
      // arrows navigate the file list whether zoomed in or not
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % items.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + items.length) % items.length); return; }
      if (e.key === "Enter") {
        // Enter opens the selected file whether zoomed in or out. When zoomed and a CRT
        // link is focused, let its native activation trigger the warp instead.
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

  // Phones show the full portrait photo, then tap to dive into the computer; desktop uses space.
  const zw = isMobile ? ZOOM_MOBILE : ZOOM_LARGE;
  const zoomStyle = zoomed
    ? { transform: `translate(${zw.translateX}%, ${zw.translateY}%) scale(${zw.scale})` }
    : undefined;

  // Touch: tap the machine to zoom in; when zoomed, tap a file to open or tap elsewhere to back out.
  const onTapMachine = (e: React.MouseEvent) => {
    if (!isMobile) return;
    if (!zoomed) { setZoomed(true); return; }
    if ((e.target as HTMLElement).closest(".crt-file")) return; // file tap → let the link open
    setZoomed(false);
  };

  return (
    <main
      className="relative flex h-dvh items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#cecac7 38%,#ddd9d6 68%,#ece9e6 100%)" }}
    >
      {intro && <IntroOverlay onDone={() => setIntro(false)} />}

      <div
        onClick={onTapMachine}
        className={`machine-frame relative shrink-0 ${animate ? "transition-transform duration-1150 ease-[cubic-bezier(.7,0,.18,1)]" : ""}`}
        style={{ width: "max(100vw, calc(100vh * 1672 / 941))", aspectRatio: IMAGE_ASPECT_LARGE, transformOrigin: `${zw.originX}% ${zw.originY}%`, ...zoomStyle }}
      >
        {/* wide room photo on desktop (whole room shown un-zoomed), portrait photo on phones — CSS picks one per breakpoint */}
        <Image src="/retro/machineLarge.png" alt="A vintage micro-computer alone in a gallery room" fill priority sizes="100vw" className="hidden object-cover select-none md:block" />
        <Image src="/retro/machineMobile.png" alt="A vintage micro-computer on a plinth" fill priority sizes="100vw" className="object-cover select-none md:hidden" />
        <div
          ref={crtRef}
          className="crt-glass absolute cursor-pointer overflow-hidden rounded-[4px/4px] bg-[#020402]"
          style={{ left: `${CUTOUT_LARGE.left}%`, top: `${CUTOUT_LARGE.top}%`, width: `${CUTOUT_LARGE.width}%`, height: `${CUTOUT_LARGE.height}%` }}
          onClick={() => { if (!isMobile && !zoomed) setZoomed(true); }}
        >
          <div ref={termRef} className="absolute left-0 top-0 origin-top-left p-[12px]">
            <CrtScreen
              items={items}
              selected={sel}
              width={isMobile ? 245 : 387}
              onHover={(i) => zoomed && setSel(i)}
              renderItem={(it, i, selected) => (
                <TransitionLink href={it.href} tabIndex={zoomed ? 0 : -1} data-crt-index={i}
                  className={`crt-file ${selected ? "sel" : ""} ${zoomed ? "" : "pointer-events-none"}`} aria-label={`Open ${it.name}`}>
                  {/* on each up/down the line you land on stays put while the others lottery-spin */}
                  <span className="pre">&gt;</span>
                  <span className="nm"><ScrambleText text={it.label} trigger={sel} active={!selected} /></span>
                  <span className="cmt"><ScrambleText text={it.comment} trigger={sel} active={!selected} /></span>
                </TransitionLink>
              )}
            />
          </div>
        </div>
      </div>

      {/* always mounted (hidden behind the intro overlay) so it's revealed in sync with the
          machine as the intro dissolves, instead of popping in after */}
      <Legend zoomed={zoomed} mobile={isMobile} />
    </main>
  );
}
