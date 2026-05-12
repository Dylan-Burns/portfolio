import Image from "next/image";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/content/projects.types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-glow)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--color-border)]">
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">{project.name}</h3>
          <Tag>{project.category}</Tag>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{project.tagline}</p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          {project.links.live && <Tag tone="live">Launch ↗</Tag>}
          <span className="text-[var(--color-fg-subtle)] transition-colors group-hover:text-[var(--color-fg)]">
            View case study →
          </span>
        </div>
      </div>
    </Link>
  );
}
