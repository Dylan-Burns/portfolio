import type { ReactNode } from "react";
import { ParticleField } from "@/components/visuals/ParticleField";
import { Footer } from "@/components/layout/Footer";
import { BackHome } from "@/components/project/BackHome";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ParticleField />
      <header className="mx-auto w-full max-w-5xl px-6 pt-7">
        <BackHome />
      </header>
      {children}
      <Footer />
    </>
  );
}
