import { Fragment } from "react";

// each shortcut: the key word(s) shown as text, then the action
const ITEMS_REST = [{ keys: ["space"], label: "zoom in" }];
const ITEMS_ZOOM = [
  { keys: ["up", "down"], label: "navigate" },
  { keys: ["enter"], label: "open" },
  { keys: ["space"], label: "zoom out" },
];
// touch wording: tap the full photo to zoom into the computer, then tap a file
const M_ITEMS_REST = [{ keys: ["tap"], label: "zoom in" }];
const M_ITEMS_ZOOM = [
  { keys: ["tap a file"], label: "open" },
  { keys: ["tap outside"], label: "zoom out" },
];

export function Legend({ zoomed, mobile = false }: { zoomed: boolean; mobile?: boolean }) {
  const items = mobile ? (zoomed ? M_ITEMS_ZOOM : M_ITEMS_REST) : zoomed ? ITEMS_ZOOM : ITEMS_REST;
  // phones: centered at the bottom over the light plinth, no pill/overlay
  const pos = mobile
    ? "tracking-[0.1em] left-1/2 bottom-[4vh] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-center"
    : zoomed
      ? "tracking-[0.16em] left-[9vw] top-1/2 -translate-y-1/2 items-start gap-[13px]"
      : "tracking-[0.16em] left-1/2 bottom-[19vh] -translate-x-1/2 items-center gap-[9px]";
  const bodyColor = "text-[#6f6655]";
  const keyColor = "text-[#3a3128]";
  return (
    <div
      aria-hidden
      className={[
        // mobile pill stays 11px (renders <768px); desktop legend shrinks on smaller/mid views, full size on large
        "pointer-events-none fixed z-40 flex flex-col font-[family-name:var(--font-mono)] text-[11px] md:text-[9px] lg:text-[10px] xl:text-[11px] uppercase",
        bodyColor,
        pos,
      ].join(" ")}
    >
      {items.map((it, i) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-2"
          // zoomed desktop staggers in; otherwise wait ~0.5s so it doesn't overlap the machine mid-transition
          style={{ animation: zoomed && !mobile ? `legendfade .5s ease ${0.1 + i * 0.14}s both` : "legendfade .45s ease .5s both" }}
        >
          {it.keys.map((k, j) => (
            <Fragment key={k}>
              {j > 0 && <span className="opacity-40">/</span>}
              <b className={`font-semibold ${keyColor}`}>{k}</b>
            </Fragment>
          ))}
          <span className="opacity-50">—</span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
