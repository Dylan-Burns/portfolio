"use client";

import Link from "next/link";
import { useState } from "react";
import { ScrambleText } from "@/components/retro/ScrambleText";

/** The "← home" button on work pages. Links back into the zoomed computer; label spins on hover. */
export function BackHome() {
  const [spin, setSpin] = useState(0);
  return (
    <Link
      href="/?view=files"
      aria-label="home"
      onMouseEnter={() => setSpin((s) => s + 1)}
      className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-fg)] backdrop-blur-sm transition-all hover:border-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
    >
      <span aria-hidden>←</span> <ScrambleText text="home" trigger={spin} />
    </Link>
  );
}
