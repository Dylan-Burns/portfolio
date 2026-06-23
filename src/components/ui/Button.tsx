"use client";

import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ScrambleText } from "@/components/retro/ScrambleText";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center gap-2 rounded-[var(--radius-button)] px-5 py-3 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] font-semibold text-[#06060c] shadow-[0_10px_34px_-10px_var(--color-accent)] hover:bg-[color-mix(in_oklab,var(--color-accent)_82%,white)]",
  secondary:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-fg)]",
  ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
};

/**
 * A link styled as a button. Every "button" on this site navigates somewhere, so
 * this always renders a `next/link`. Pass `external` for off-site links — it opens
 * in a new tab safely and appends a ↗ affordance. A string label lottery-spins on hover.
 */
export function Button({
  children,
  variant = "primary",
  external = false,
  className,
  ...rest
}: { children: ReactNode; variant?: Variant; external?: boolean } & ComponentProps<typeof Link>) {
  const [spin, setSpin] = useState(0);
  return (
    <Link
      className={cn(base, variants[variant], className)}
      onMouseEnter={() => setSpin((s) => s + 1)}
      aria-label={typeof children === "string" ? children : undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {typeof children === "string" ? <ScrambleText text={children} trigger={spin} /> : children}
      {external && <span aria-hidden>↗</span>}
    </Link>
  );
}
