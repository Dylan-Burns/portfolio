import { SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { ActionButtons } from "./ActionButtons";
import type { Project } from "@/content/projects.types";

export function ProjectHero({ project }: { project: Project }) {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pb-12 pt-28 md:pt-36">
      <Reveal>
        <SectionLabel>{`${project.category} · ${project.period} · ${project.role}`}</SectionLabel>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-6xl">
          {project.name}
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">
          {project.summary}
        </p>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-8">
          <ActionButtons links={project.links} />
        </div>
      </Reveal>
    </header>
  );
}
