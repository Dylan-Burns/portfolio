"use client";

import { useEffect, useState } from "react";

/** True on narrow (phone) viewports — the Tailwind `md` breakpoint, max-width 767px.
 * Starts false for SSR, then resolves on mount and tracks resize/orientation changes. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}
