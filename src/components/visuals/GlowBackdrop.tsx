import { cn } from "@/lib/cn";

/**
 * Fixed, decorative ambient glow behind the page content. Pure CSS — no animation,
 * so nothing to gate behind reduced motion. `variant` nudges position/feel.
 */
export function GlowBackdrop({ variant = "page" }: { variant?: "hero" | "page" }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={cn(
          "absolute h-[40rem] w-[40rem] rounded-full opacity-40 blur-[120px]",
          variant === "hero" ? "-right-40 -top-56" : "-left-56 -top-72",
        )}
        style={{
          background:
            "conic-gradient(from 120deg, var(--color-accent), var(--color-accent-2), var(--color-accent-3), var(--color-accent))",
        }}
      />
      <div
        className="absolute bottom-[-20rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--color-accent-3), transparent 70%)" }}
      />
    </div>
  );
}
