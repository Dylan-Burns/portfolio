"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CUTOUT_LARGE, IMAGE_ASPECT_LARGE, ZOOM_LARGE, ZOOM_MOBILE } from "./cutout";
import { CrtScreen } from "./CrtScreen";
import { IntroOverlay } from "./IntroOverlay";
import { Legend } from "./Legend";
import { TransitionLink } from "./TransitionLink";
import { ScrambleText } from "./ScrambleText";
import { useIsMobile } from "./useIsMobile";
import { useWarp } from "./WarpOverlay";
import { GameLayer } from "./games/GameLayer";
import { sfx } from "./games/beep";
import type { FileItem } from "@/content/file-items";

// Delay before the screen powers on after a zoom-in. A touch shorter than the
// machine-frame zoom transition (`duration-1150` below) because its ease settles the
// transform into place before the tail of the transition finishes — so the turn-on
// fires right as the machine arrives rather than after a beat of dead time.
const POWER_ON_DELAY = 920;

export function RetroComputer({ items, initialZoom = false }: { items: FileItem[]; initialZoom?: boolean }) {
  // deep-linked from a work page (/?view=files): skip the intro and land already zoomed into the file list
  const [intro, setIntro] = useState(!initialZoom);
  const [zoomed, setZoomed] = useState(initialZoom);
  const [sel, setSel] = useState(0);
  const [dir, setDir] = useState<"root" | "games">("root"); // current CRT directory
  const [game, setGame] = useState<null | "pong" | "snake">(null); // active in-screen game
  // White camera-flash that covers the intro→landing swap. Fading the intro panel
  // out directly crossfades it over the machine (~1s of ghosting → reads as glitchy);
  // instead we flash to full white, swap underneath while opaque, then fade the white
  // away to reveal the scene with no overlap. Reduced-motion skips it (instant swap).
  const reduce = useReducedMotion();
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onIntroDone = useCallback(() => {
    if (reduce) { setIntro(false); return; }
    setFlash(true); // white fades in fast over the still-opaque intro
    flashTimer.current = setTimeout(() => {
      setIntro(false); // swap to the landing while fully white...
      setFlash(false); // ...then fade the white away to reveal it
    }, 200);
  }, [reduce]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // CRT power: the screen is dark while zoomed out, then plays a tube turn-on once the
  // zoom-in settles, and a collapse turn-off as it zooms back out. `screen` gates the
  // content visibility; `anim` (keyed by `animKey` so it restarts) drives the beam overlay.
  const [screen, setScreen] = useState<"off" | "on">(initialZoom ? "on" : "off");
  const [anim, setAnim] = useState<null | "on" | "off">(null);
  const [animKey, setAnimKey] = useState(0);
  const firstPower = useRef(true);
  useEffect(() => {
    if (firstPower.current) { firstPower.current = false; return; } // no anim on first paint / deep-link landing
    if (reduce) {
      // instant on/off, no beam — deferred a tick to stay out of the render path
      const id = setTimeout(() => { setScreen(zoomed ? "on" : "off"); setAnim(null); }, 0);
      return () => clearTimeout(id);
    }
    if (zoomed) {
      // wait for the zoom-in transform to finish, then power the tube on
      const id = setTimeout(() => { setScreen("on"); setAnim("on"); setAnimKey((k) => k + 1); }, POWER_ON_DELAY);
      return () => clearTimeout(id);
    }
    // zooming back out: collapse the screen off (plays over the shrinking machine);
    // deferred a tick to stay out of the render path
    const id = setTimeout(() => { setScreen("off"); setAnim("off"); setAnimKey((k) => k + 1); }, 0);
    return () => clearTimeout(id);
  }, [zoomed, reduce]);

  // Clear the power animation after its longest layer finishes (beam .6s, warm-up .72s,
  // roll .3s+.85s for "on"; collapse .5s for "off"). Driving this off the beam's
  // onAnimationEnd would cut the slower warm-up/roll short.
  useEffect(() => {
    if (!anim) return;
    const id = setTimeout(() => setAnim(null), anim === "on" ? 1250 : 560);
    return () => clearTimeout(id);
  }, [anim, animKey]);
  // Don't animate the zoom on the first paint: when we land already-zoomed (deep-link from a work
  // page) the mobile/desktop check resolves a beat after mount, nudging the transform — without this
  // gate that nudge plays as a visible 1.15s re-zoom. Enable the transition one frame after mount.
  const [animate, setAnimate] = useState(false);
  const crtRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { play } = useWarp();

  // The CRT list is the project files plus a `games/` folder; opening the folder swaps to a
  // sub-list (back / pong / snake). Games boot in-screen instead of navigating, so they're a
  // distinct entry kind from the warping project links.
  type Entry =
    | { kind: "link"; name: string; label: string; comment: string; href: string }
    | { kind: "folder"; name: string; label: string; comment: string }
    | { kind: "game"; name: string; label: string; comment: string; game: "pong" | "snake" }
    | { kind: "back"; name: string; label: string; comment: string };
  // project links + the résumé (always the last of `items`, per toFileItems)
  const linkEntries: Entry[] = items.map((it): Entry => ({ kind: "link", name: it.name, label: it.label, comment: it.comment, href: it.href }));
  // games are desktop-only — the arcade chrome is too cramped in the small mobile CRT
  const gamesFolder: Entry = { kind: "folder", name: "games", label: "games/", comment: "arcade" };
  const rootEntries: Entry[] = isMobile
    ? linkEntries
    : // games/ sits just above the résumé (the last item)
      [...linkEntries.slice(0, -1), gamesFolder, ...linkEntries.slice(-1)];
  const entries: Entry[] =
    dir === "root"
      ? rootEntries
      : [
          { kind: "back", name: "back", label: "../", comment: "" },
          { kind: "game", name: "Pong", label: "pong.exe", comment: "game", game: "pong" },
          { kind: "game", name: "Snake", label: "snake.exe", comment: "game", game: "snake" },
        ];
  // mirror the latest entries into a ref so the keydown handler reads the current list
  // without re-subscribing every render
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  });
  const openEntry = useCallback(
    (e: Entry) => {
      if (e.kind === "link") { play(e.href); return; } // warp to the project route
      if (e.kind === "folder") { setDir("games"); setSel(0); return; }
      if (e.kind === "back") { setDir("root"); setSel(0); return; }
      sfx.select();
      setGame(e.game); // boot the game in-screen
    },
    [play],
  );

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
      if (game) return; // a running game owns the keyboard until it's quit
      const list = entriesRef.current;
      if (e.key === " ") { e.preventDefault(); setZoomed((z) => !z); return; } // Space toggles zoom in/out
      // arrows navigate the list whether zoomed in or not
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % list.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + list.length) % list.length); return; }
      if (e.key === "Escape" && dir === "games") { e.preventDefault(); setDir("root"); setSel(0); return; }
      if (e.key === "Enter") {
        // When a CRT link/button is focused, let its native activation handle it (warp / open).
        if ((document.activeElement as HTMLElement | null)?.closest(".crt-file")) return;
        e.preventDefault();
        openEntry(list[sel]);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [intro, game, dir, sel, openEntry]);

  // once the screen has powered on, move focus to the selected file so keyboard users land
  // on the active list (the links are inert/invisible until then, during the zoom + turn-on)
  useEffect(() => {
    if (!zoomed || screen !== "on" || game) return;
    (document.querySelector(`[data-crt-index="${sel}"]`) as HTMLElement | null)?.focus();
  }, [zoomed, sel, screen, dir, game]);

  // Phones show the full portrait photo, then tap to dive into the computer; desktop uses space.
  const zw = isMobile ? ZOOM_MOBILE : ZOOM_LARGE;
  const zoomStyle = zoomed
    ? { transform: `translate(${zw.translateX}%, ${zw.translateY}%) scale(${zw.scale})` }
    : undefined;

  // Touch: tap the machine to zoom in; when zoomed, tap a file to open or tap elsewhere to back out.
  const onTapMachine = (e: React.MouseEvent) => {
    if (!isMobile || game) return; // a running game has its own full-screen overlay
    if (!zoomed) { setZoomed(true); return; }
    if ((e.target as HTMLElement).closest(".crt-file")) return; // file tap → let the link open
    setZoomed(false);
  };

  return (
    <main
      className="relative flex h-dvh items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(180deg,#c2beba 0%,#cecac7 38%,#ddd9d6 68%,#ece9e6 100%)" }}
    >
      {intro && <IntroOverlay onDone={onIntroDone} />}

      {/* Camera flash covering the intro→landing swap: snaps to white (~150ms), then
          eases away (~650ms). pointer-events-none + always opacity 0 when idle. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[95] bg-white ease-out"
        style={{ opacity: flash ? 1 : 0, transition: `opacity ${flash ? 150 : 650}ms ease-out` }}
      />


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
          <div
            ref={termRef}
            className={`crt-content absolute left-0 top-0 origin-top-left p-[12px] ${screen} ${anim === "on" ? "flicker" : ""}`}
          >
            <CrtScreen
              items={entries}
              selected={sel}
              path={dir === "root" ? "./work" : "./games"}
              width={isMobile ? 245 : 387}
              onHover={(i) => zoomed && setSel(i)}
              renderItem={(entry, i, selected) => {
                const active = zoomed && screen === "on";
                const cls = `crt-file ${selected ? "sel" : ""} ${active ? "" : "pointer-events-none"}`;
                // project links warp; folder/game/back act in-place
                if (entry.kind === "link") {
                  return (
                    <TransitionLink href={entry.href} tabIndex={active ? 0 : -1} data-crt-index={i}
                      className={cls} aria-label={`Open ${entry.name}`}>
                      {/* on each up/down the line you land on stays put while the others lottery-spin */}
                      <span className="pre">&gt;</span>
                      <span className="nm"><ScrambleText text={entry.label} trigger={sel} active={!selected} /></span>
                      <span className="cmt"><ScrambleText text={entry.comment} trigger={sel} active={!selected} /></span>
                    </TransitionLink>
                  );
                }
                return (
                  <button type="button" tabIndex={active ? 0 : -1} data-crt-index={i}
                    onClick={() => active && openEntry(entry)} className={cls}
                    aria-label={entry.kind === "back" ? "Back" : `Open ${entry.name}`}>
                    <span className="pre">{entry.kind === "back" ? "" : ">"}</span>
                    <span className="nm">
                      {entry.kind === "back" ? "../" : <ScrambleText text={entry.label} trigger={sel} active={!selected} />}
                    </span>
                    {entry.comment && (
                      <span className="cmt"><ScrambleText text={entry.comment} trigger={sel} active={!selected} /></span>
                    )}
                  </button>
                );
              }}
            />
          </div>
          {/* the bright tube beam: snaps to a scanline & blooms on zoom-in, collapses on zoom-out */}
          {anim && <span key={animKey} aria-hidden className={`crt-power ${anim}`} />}
          {/* a single scanline that rolls down once as the picture stabilises after turn-on */}
          {anim === "on" && <span key={`roll-${animKey}`} aria-hidden className="crt-roll on" />}
        </div>
      </div>

      {/* a launched game renders as a fixed overlay pinned to the (zoomed) CRT glass */}
      {game && <GameLayer glassRef={crtRef} game={game} onQuit={() => setGame(null)} />}

      {/* always mounted (hidden behind the intro overlay) so it's revealed in sync with the
          machine as the intro dissolves, instead of popping in after */}
      <Legend zoomed={zoomed} mobile={isMobile} />
    </main>
  );
}
