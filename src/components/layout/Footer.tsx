import { site } from "@/content/site";

/** Site footer — doubles as the `#contact` section the nav links to. */
export function Footer() {
  return (
    <footer
      id="contact"
      className="scroll-mt-24 border-t border-[var(--color-border)] font-[family-name:var(--font-mono)]"
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">Contact</p>
        <h2 className="mt-4 text-gradient text-2xl font-semibold tracking-tight md:text-4xl">
          Let&apos;s build something.
          <span aria-hidden className="type-caret" />
        </h2>
        <a
          href={`mailto:${site.email}`}
          className="mt-6 inline-block text-sm text-[var(--color-fg-muted)] underline-offset-4 transition-colors hover:text-[var(--color-fg)] hover:underline md:text-base"
        >
          {site.email}
        </a>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
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
