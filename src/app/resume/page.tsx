import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Section";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Résumé",
  description: `Résumé of ${site.name} — ${site.role}.`,
};

export default function ResumePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-28 md:pt-36">
      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        ← work
      </Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Résumé</SectionLabel>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--color-fg)] md:text-5xl">
            {site.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href={site.resumePath} download>
            Download PDF ↓
          </Button>
          <Button href={site.resumePath} external variant="secondary">
            Open in new tab
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <iframe
          src={`${site.resumePath}#view=FitH`}
          title={`Résumé of ${site.name} (PDF)`}
          className="block h-[85vh] w-full"
        />
      </div>
      <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-subtle)]">
        If the résumé doesn&apos;t load above,{" "}
        <a href={site.resumePath} download className="underline underline-offset-4 hover:text-[var(--color-fg)]">
          download the PDF
        </a>
        .
      </p>
    </main>
  );
}
