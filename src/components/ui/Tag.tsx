import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A small hairline pill label (e.g. a stack item). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
