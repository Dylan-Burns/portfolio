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

export function Gallery({ project }: { project: Project }) {
  const isPhone = project.frame === "phone";
  const url = hostOf(project.links.live);
  return (
    <Section className="!py-12">
      <div className={isPhone ? "flex flex-wrap justify-center gap-6" : "space-y-8"}>
        {project.video && (
          <Reveal>
            <Framed frame={project.frame} url={url}>
              <video
                className={isPhone ? "block h-full w-full object-cover" : "block aspect-video w-full object-cover"}
                src={project.video.src}
                poster={project.video.poster}
                autoPlay
                muted
                loop
                playsInline
              />
            </Framed>
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
