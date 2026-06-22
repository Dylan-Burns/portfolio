"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";

type NavLink = { label: string; href: string };

const links: NavLink[] = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Résumé", href: "/resume" },
  // Anchors to the Footer's id="contact" (rendered by the layout on every page).
  { label: "Contact", href: "/#contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors",
        scrolled &&
          "border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_72%,transparent)] backdrop-blur-md",
      )}
    >
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight">
          {site.name}
        </Link>

        <button
          type="button"
          className="rounded-md px-2 py-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <div className="hidden items-center gap-7 font-[family-name:var(--font-mono)] text-xs text-[var(--color-fg-muted)] md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "group relative transition-colors hover:text-[var(--color-fg)]",
                l.label === "Contact" && "text-[var(--color-fg)]",
              )}
            >
              {l.label}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-0 bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-accent-3))] transition-all duration-300 group-hover:w-full"
              />
            </Link>
          ))}
        </div>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-2)] px-6 py-4 font-[family-name:var(--font-mono)] text-sm md:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={() => setOpen(false)}
            className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
