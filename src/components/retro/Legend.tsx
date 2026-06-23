import { Fragment } from "react";

// each shortcut: the key word(s) shown as text, then the action
const ITEMS_REST = [{ keys: ["space"], label: "zoom in" }];
const ITEMS_ZOOM = [
  { keys: ["up", "down"], label: "navigate" },
  { keys: ["enter"], label: "open" },
  { keys: ["space"], label: "zoom out" },
];

export function Legend({ zoomed }: { zoomed: boolean }) {
  const items = zoomed ? ITEMS_ZOOM : ITEMS_REST;
  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed z-40 flex flex-col font-[family-name:var(--font-mono)] uppercase",
        "text-[11px] tracking-[0.16em] text-[#6f6655]",
        zoomed
          ? "left-[12vw] top-1/2 -translate-y-1/2 items-start gap-[13px]"
          : "left-1/2 bottom-[19vh] -translate-x-1/2 items-center gap-[9px]",
      ].join(" ")}
    >
      {items.map((it, i) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-2"
          style={zoomed ? { animation: `legendfade .5s ease ${0.1 + i * 0.14}s both` } : undefined}
        >
          {it.keys.map((k, j) => (
            <Fragment key={k}>
              {j > 0 && <span className="opacity-40">/</span>}
              <b className="font-semibold text-[#3a3128]">{k}</b>
            </Fragment>
          ))}
          <span className="opacity-50">—</span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
