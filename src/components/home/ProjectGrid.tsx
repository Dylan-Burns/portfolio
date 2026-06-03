import { projects } from "@/content/projects";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCarousel } from "./ProjectCarousel";

export function ProjectGrid() {
  return (
    <Section id="work">
      <Reveal>
        <SectionLabel>Selected work</SectionLabel>
      </Reveal>
      <Reveal delay={0.05}>
        <SectionHeading className="text-gradient mt-3">Four products, end to end.</SectionHeading>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-4 max-w-xl text-[var(--color-fg-muted)]">
          Each one shipped — designed, built, and deployed. Slide a project into the spotlight, click in for the
          story, then go use the real thing.
        </p>
      </Reveal>
      <Reveal delay={0.15}>
        <ProjectCarousel projects={projects} />
      </Reveal>
    </Section>
  );
}
