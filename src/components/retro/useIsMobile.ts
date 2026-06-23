"use client";

import { useEffect, useLayoutEffect, useState } from "react";

// resolve before the browser paints the hydrated frame (so the zoom transform is correct on the
// first paint), but fall back to a passive effect during SSR where layout effects don't run
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** True on narrow (phone) viewports — the Tailwind `md` breakpoint, max-width 767px.
 * Starts false for SSR, then resolves before first paint and tracks resize/orientation changes. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}
