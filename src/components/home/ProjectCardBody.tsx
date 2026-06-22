import Image from "next/image";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { Project } from "@/content/projects.types";

/**
 * Presentational project card — cover image + meta. No link wrapper of its own, so
 * the carousel can decide whether a given card navigates (centered) or slides into
 * focus (off to the side). `active` drives the spotlight emphasis.
 */
export function ProjectCardBody({ project, active }: { project: Project; active: boolean }) {
  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)] backdrop-blur-sm transition-colors duration-300",
        active
          ? "border-[var(--color-border-strong)] shadow-[var(--shadow-glow)]"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--color-border)]">
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          fill
          sizes="(max-width: 768px) 92vw, 600px"
          className={cn("object-cover transition-transform duration-500", active && "scale-[1.02]")}
        />
      </div>
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold md:text-xl">{project.name}</h3>
          <Tag>{project.category}</Tag>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)] md:text-[0.95rem]">{project.tagline}</p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          {project.links.live && <Tag tone="live">Launch ↗</Tag>}
          <span
            className={cn(
              "font-[family-name:var(--font-mono)] text-[11px] transition-colors",
              active ? "text-[var(--color-fg)]" : "text-[var(--color-fg-subtle)]",
            )}
          >
            View case study →
          </span>
        </div>
      </div>
    </div>
  );
}
