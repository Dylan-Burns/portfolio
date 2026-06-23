import { Button } from "@/components/ui/Button";
import { BackHome } from "@/components/project/BackHome";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
        404
      </p>
      <p className="mt-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-fg-muted)]">
        <span className="text-[var(--color-fg-subtle)]">&gt;</span> file not found
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--color-fg)]">
        That page doesn&apos;t exist.
      </h1>
      <p className="mt-4 text-[var(--color-fg-muted)]">Maybe the project moved, or the link was mistyped.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button href="/">See the work →</Button>
        <BackHome />
      </div>
    </main>
  );
}
