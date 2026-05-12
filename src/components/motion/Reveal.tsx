"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { reveal } from "./motion-config";

/** Tags this wrapper can render as. Keep small so `motion[tag]` stays well-typed. */
type RevealTag = "div" | "section" | "header" | "ul" | "li" | "span";

/**
 * Reveals its children with a subtle fade-up the first time they scroll into view.
 * Renders children plainly (no animation) when the user prefers reduced motion.
 */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: RevealTag;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
