import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24 pt-28 md:pb-28 md:pt-40">
      <Reveal>
        <SectionLabel>{site.role}</SectionLabel>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="text-gradient mt-5 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
          Software products that people actually use.
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-fg-muted)] md:text-lg">
          From healthcare automation to consumer apps — Parahealth, Claruss, and more. I design, build, and ship the
          whole thing.
        </p>
      </Reveal>
      <Reveal delay={0.15}>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="/#work">See my work →</Button>
          <Button href="/#about" variant="secondary">
            About me
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
