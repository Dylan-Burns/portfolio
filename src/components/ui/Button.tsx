import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]";

const variants: Record<Variant, string> = {
  primary:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface-hover)] text-[var(--color-fg)] hover:bg-[color-mix(in_oklab,white_12%,transparent)] hover:border-[var(--color-fg)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]",
  ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
};

/**
 * A link styled as a button. Every "button" on this site navigates somewhere, so
 * this always renders a `next/link`. Pass `external` for off-site links — it opens
 * in a new tab safely and appends a ↗ affordance.
 */
export function Button({
  children,
  variant = "primary",
  external = false,
  className,
  ...rest
}: { children: ReactNode; variant?: Variant; external?: boolean } & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variants[variant], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {external && <span aria-hidden>↗</span>}
    </Link>
  );
}
