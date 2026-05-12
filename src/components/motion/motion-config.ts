// A cubic-bezier ease-out. Not `as const` — Framer Motion's `ease` field wants a mutable
// `[number, number, number, number]`, and a readonly tuple isn't assignable to it under `tsc`.
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};
