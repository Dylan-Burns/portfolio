import Image from "next/image";
import type { ReactNode } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { PhoneFrame } from "./PhoneFrame";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import type { Project } from "@/content/projects.types";

function hostOf(url?: string): string | undefined {
  try {
    return url ? new URL(url).host : undefined;
  } catch {
    return undefined;
  }
}

/** Wraps gallery media in the right device frame for the project. */
function Framed({ frame, url, children }: { frame: Project["frame"]; url?: string; children: ReactNode }) {
  return frame === "phone" ? <PhoneFrame>{children}</PhoneFrame> : <BrowserFrame url={url}>{children}</BrowserFrame>;
}

/** Mono caption above a gallery window. A link (with ↗) when `href` is given, plain text otherwise. */
function WindowTitle({ children, href }: { children: ReactNode; href?: string }) {
  const cls =
    "mb-3 inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]";
  if (!href) return <figcaption className={cls}>{children}</figcaption>;
  return (
    <figcaption>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cls} group transition-colors hover:text-[var(--color-fg)]`}
      >
        {children}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          ↗
        </span>
      </a>
    </figcaption>
  );
}

/** The lead demo clip — an embed (e.g. Loom) or a self-hosted looping video. */
function VideoMedia({ project, isPhone }: { project: Project; isPhone: boolean }) {
  const v = project.video!;
  const fill = isPhone ? "block h-full w-full" : "block aspect-video w-full";
  return v.embed ? (
    <iframe
      className={fill}
      src={v.embed}
      title={`${project.name} — demo walkthrough`}
      allow="fullscreen; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <video className={`${fill} object-cover`} src={v.src} poster={v.poster} autoPlay muted loop playsInline />
  );
}

export function Gallery({ project }: { project: Project }) {
  const isPhone = project.frame === "phone";
  const url = hostOf(project.links.live);
  // the walkthrough is of the product app — only label its window when there's an explicit app URL
  const videoUrl = hostOf(project.links.app);
  const marketing = project.marketingSite;
  // only label the windows when there's more than one to tell apart
  const titled = Boolean(project.video && marketing);

  return (
    <Section className="!py-12">
      <div className={isPhone ? "flex flex-wrap justify-center gap-6" : "space-y-10"}>
        {project.video && (
          <Reveal>
            <figure>
              {titled && <WindowTitle>App</WindowTitle>}
              <Framed frame={project.frame} url={videoUrl}>
                <VideoMedia project={project} isPhone={isPhone} />
              </Framed>
            </figure>
          </Reveal>
        )}
        {marketing && (
          <Reveal>
            <figure>
              <WindowTitle href={marketing.href}>Marketing site</WindowTitle>
              <BrowserFrame url={hostOf(marketing.href)}>
                <Image
                  src={marketing.image.src}
                  alt={marketing.image.alt}
                  width={marketing.image.width}
                  height={marketing.image.height}
                  className="block h-auto w-full"
                />
              </BrowserFrame>
            </figure>
          </Reveal>
        )}
        {project.screenshots.map((s) => (
          <Reveal key={s.src}>
            <Framed frame={project.frame} url={url}>
              <Image src={s.src} alt={s.alt} width={s.width} height={s.height} className="block h-auto w-full" />
            </Framed>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
