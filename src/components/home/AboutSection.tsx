import Image from "next/image";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function AboutSection() {
  const { portrait, bio, tools, now } = site.about;
  const { socials } = site;
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
            <p className="flex items-center gap-2.5 text-[var(--color-fg-subtle)]">
              <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--color-live)] shadow-[0_0_8px_var(--color-live)]" />
              <span className="italic">{now}</span>
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap gap-2">
            {tools.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)]">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--color-fg)]"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
