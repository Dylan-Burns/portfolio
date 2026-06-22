import Link from "next/link";
import type { Project } from "@/content/projects.types";

export function ProjectPager({ prev, next }: { prev: Project; next: Project }) {
  return (
    <nav aria-label="Project navigation" className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 border-t border-[var(--color-border)] px-6 py-12">
      <Link href={`/work/${prev.slug}`} className="group">
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-subtle)]">← Previous</span>
        <span className="mt-1 block font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-fg-muted)] transition-colors group-hover:text-[var(--color-fg)] md:text-lg">
          {prev.name}
        </span>
      </Link>
      <Link href={`/work/${next.slug}`} className="group text-right">
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-subtle)]">Next →</span>
        <span className="mt-1 block font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-fg-muted)] transition-colors group-hover:text-[var(--color-fg)] md:text-lg">
          {next.name}
        </span>
      </Link>
    </nav>
  );
}
