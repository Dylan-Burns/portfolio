import Image from "next/image";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function AboutSection() {
  const { portrait, bio, tools, now } = site.about;
  return (
    <Section id="about" className="grid items-start gap-12 md:grid-cols-[280px_1fr]">
      <Reveal>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <Image src={portrait.src} alt={portrait.alt} fill sizes="(max-width: 768px) 100vw, 280px" className="object-cover" />
        </div>
      </Reveal>
      <div>
        <Reveal>
          <SectionLabel>About</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <SectionHeading className="mt-3">Hi, I&apos;m Dylan.</SectionHeading>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-5 space-y-4 leading-relaxed text-[var(--color-fg-muted)]">
            {bio.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <p className="text-[var(--color-fg-subtle)] italic">{now}</p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap gap-2">
            {tools.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
