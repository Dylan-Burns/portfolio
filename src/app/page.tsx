import { Hero } from "@/components/home/Hero";
import { ProjectGrid } from "@/components/home/ProjectGrid";
import { AboutSection } from "@/components/home/AboutSection";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProjectGrid />
      <AboutSection />
    </main>
  );
}
