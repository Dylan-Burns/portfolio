import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, getProject, adjacentProjects } from "@/content/projects";
import { ProjectHero } from "@/components/project/ProjectHero";
import { Gallery } from "@/components/project/Gallery";
import { BuildStory } from "@/components/project/BuildStory";
import { ProjectPager } from "@/components/project/ProjectPager";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.name,
    description: project.summary,
    openGraph: { title: project.name, description: project.summary },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const adj = adjacentProjects(slug)!;
  return (
    <main>
      <ProjectHero project={project} />
      <Gallery project={project} />
      <BuildStory project={project} />
      <ProjectPager prev={adj.prev} next={adj.next} />
    </main>
  );
}
