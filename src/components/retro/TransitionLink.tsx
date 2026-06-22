"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useWarp } from "./WarpOverlay";

export function TransitionLink({ href, children, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { play } = useWarp();
  return (
    <Link
      href={href}
      onClick={(e) => {
        // let modified clicks / new-tab behave normally
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        play(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
