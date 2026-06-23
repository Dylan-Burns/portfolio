import type { ReactNode } from "react";
import Link from "next/link";
import { ParticleField } from "@/components/visuals/ParticleField";
import { Footer } from "@/components/layout/Footer";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ParticleField />
      <header className="mx-auto w-full max-w-5xl px-6 pt-7">
        <Link href="/" className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]">
          ← work
        </Link>
      </header>
      {children}
      <Footer />
    </>
  );
}
