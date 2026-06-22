import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A small pill label. `tone="live"` tints it the "launch" green. */
export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "live";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
        tone === "live"
          ? "border-[color-mix(in_oklab,var(--color-live)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-live)_12%,transparent)] text-[var(--color-live)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
