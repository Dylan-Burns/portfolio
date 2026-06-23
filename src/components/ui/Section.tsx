import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small monospace kicker above a section heading. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("label-mono inline-flex items-center gap-3 uppercase", className)}>
      <span aria-hidden className="h-px w-8 bg-[var(--color-border-strong)]" />
      {children}
    </p>
  );
}

/** A page section with consistent max-width, padding, and scroll-margin for anchor links. */
export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-20 md:py-28", className)}>
      {children}
    </section>
  );
}
