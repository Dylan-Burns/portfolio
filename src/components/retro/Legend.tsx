const ITEMS_REST = [{ b: "Press Enter", rest: " to zoom" }];
const ITEMS_ZOOM = [
  { b: "Arrow keys", rest: " — navigate" },
  { b: "Enter", rest: " — open" },
  { b: "Esc", rest: " — back" },
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
          ? "left-[15vw] top-1/2 -translate-y-1/2 items-start gap-[13px]"
          : "left-1/2 bottom-[19vh] -translate-x-1/2 items-center gap-[9px]",
      ].join(" ")}
    >
      {items.map((it, i) => (
        <span key={it.b} style={zoomed ? { animation: `legendfade .5s ease ${0.1 + i * 0.14}s both` } : undefined}>
          <b className="font-semibold text-[#3a3128]">{it.b}</b>
          {it.rest}
        </span>
      ))}
    </div>
  );
}
