import { Section, SectionLabel } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import type { Project } from "@/content/projects.types";

function Prose({ paras }: { paras: string[] }) {
  return (
    <div className="mt-3 space-y-4 leading-relaxed text-[var(--color-fg-muted)]">
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function BuildStory({ project }: { project: Project }) {
  return (
    <Section className="space-y-12">
      <Reveal>
        <div>
          <SectionLabel>Problem</SectionLabel>
          <Prose paras={project.problem} />
        </div>
      </Reveal>
      <Reveal>
        <div>
          <SectionLabel>What I built</SectionLabel>
          <Prose paras={project.whatIBuilt} />
        </div>
      </Reveal>
      <Reveal>
        <div>
          <SectionLabel>Stack</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal>
        <div>
          <SectionLabel>Outcomes</SectionLabel>
          <ul className="mt-3 space-y-2 text-[var(--color-fg-muted)]">
            {project.outcomes.map((o, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="text-[var(--color-accent)]">
                  —
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
