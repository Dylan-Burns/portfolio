import { site } from "@/content/site";

/** Site footer — doubles as the `#contact` section the nav links to. */
export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-[var(--color-border)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">Contact</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-5xl">
          Let&apos;s build something.
        </h2>
        <a
          href={`mailto:${site.email}`}
          className="mt-6 inline-block text-lg text-[var(--color-fg-muted)] underline-offset-4 transition-colors hover:text-[var(--color-fg)] hover:underline"
        >
          {site.email}
        </a>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-fg-muted)]">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--color-fg)]"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
        <p className="mt-12 text-xs text-[var(--color-fg-subtle)]">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
