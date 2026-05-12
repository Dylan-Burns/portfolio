import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A tall phone bezel with a notch. Content is clipped to a ~9:19.5 portrait viewport. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[220px] overflow-hidden rounded-[2.4rem] border-[8px] border-[#1c1d2e] bg-black shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <div aria-hidden className="absolute left-1/2 top-2 z-10 h-3.5 w-14 -translate-x-1/2 rounded-b-xl bg-[#1c1d2e]" />
      <div className="aspect-[9/19.5]">{children}</div>
    </div>
  );
}
