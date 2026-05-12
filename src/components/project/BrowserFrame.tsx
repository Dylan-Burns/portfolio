import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TRAFFIC_LIGHTS = ["#ff5f57", "#febc2e", "#28c840"];

/** Faux browser chrome — a title bar with traffic-light dots and a URL pill, then the content. */
export function BrowserFrame({ url, children, className }: { url?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-bg-2)] shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-2)_60%,white_4%)] px-3 py-2.5"
      >
        <div className="flex gap-1.5">
          {TRAFFIC_LIGHTS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        {url && (
          <div className="flex-1 truncate rounded-md bg-[var(--color-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-fg-subtle)]">
            {url}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
