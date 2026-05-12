import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
        That page doesn&apos;t exist.
      </h1>
      <p className="mt-4 text-[var(--color-fg-muted)]">Maybe the project moved, or the link was mistyped.</p>
      <div className="mt-8">
        <Button href="/#work">See the work →</Button>
      </div>
    </main>
  );
}
