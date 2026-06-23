import { Reveal } from "@/components/motion/Reveal";
import { ActionButtons } from "./ActionButtons";
import type { Project } from "@/content/projects.types";

export function ProjectHero({ project }: { project: Project }) {
  const meta = [project.category, project.period, project.role];
  const hasLinks = Object.values(project.links).some(Boolean);
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pb-16 pt-28 font-[family-name:var(--font-mono)] md:pb-20 md:pt-40">
      <Reveal>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {meta.map((m, i) => (
            <li key={m} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />}
              {m}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.02em] text-[var(--color-fg)] md:text-6xl">
          {project.name}
          <span aria-hidden className="type-caret" />
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="content-panel mt-7 max-w-2xl p-5 md:p-6">
          <p className="text-[14px] leading-[1.75] text-[var(--color-fg-muted)] md:text-[15px]">
            {project.summary}
          </p>
        </div>
      </Reveal>
      {hasLinks && (
        <Reveal delay={0.15}>
          <div className="mt-9">
            <ActionButtons links={project.links} />
          </div>
        </Reveal>
      )}
    </header>
  );
}
