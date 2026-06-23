import type { ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import type { Project } from "@/content/projects.types";

function Prose({ paras }: { paras: string[] }) {
  return (
    <div className="space-y-4 text-[14px] leading-[1.75] text-[var(--color-fg-muted)] md:text-[15px]">
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** One editorial row: a `// comment`-style mono label in the left rail, content in a reading column. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Reveal as="section">
      <div className="grid gap-x-12 gap-y-5 border-t border-[var(--color-border)] pt-10 md:grid-cols-12 md:pt-12">
        <h2 className="text-sm font-bold lowercase tracking-[0.01em] text-[var(--color-fg)] md:col-span-3 md:sticky md:top-24 md:self-start">
          <span aria-hidden className="mr-1.5 font-medium text-[var(--color-fg-muted)]">{"//"}</span>
          {label}
          <span aria-hidden className="type-caret" />
        </h2>
        <div className="content-panel p-5 md:col-span-9 md:max-w-[64ch] md:p-6">{children}</div>
      </div>
    </Reveal>
  );
}

export function BuildStory({ project }: { project: Project }) {
  return (
    <Section className="space-y-12 font-[family-name:var(--font-mono)] md:space-y-16">
      <Row label="Problem">
        <Prose paras={project.problem} />
      </Row>
      <Row label="What I built">
        <Prose paras={project.whatIBuilt} />
      </Row>
      {project.architecture && (
        <Row label="Architecture">
          <Prose paras={project.architecture} />
        </Row>
      )}
      <Row label="Stack">
        <div className="flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      </Row>
      <Row label="Outcomes">
        <ul className="divide-y divide-[var(--color-border)] [&>li:first-child]:pt-0">
          {project.outcomes.map((o, i) => (
            <li
              key={i}
              className="flex gap-3 py-3.5 text-[14px] leading-[1.75] text-[var(--color-fg-muted)] md:text-[15px]"
            >
              <span aria-hidden className="select-none text-[var(--color-accent)]">
                →
              </span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Row>
    </Section>
  );
}
