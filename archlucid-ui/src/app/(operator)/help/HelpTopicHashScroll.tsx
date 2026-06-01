"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToHashFragment(): void {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "").trim() : "";

  if (hash.length === 0) {
    return;
  }

  requestAnimationFrame(() => {
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/** Scrolls to `#fragment` after documentation search or in-page hash navigation. */
export function HelpTopicHashScroll(): null {
  const pathname = usePathname();

  useEffect(() => {
    scrollToHashFragment();

    window.addEventListener("hashchange", scrollToHashFragment);

    return () => {
      window.removeEventListener("hashchange", scrollToHashFragment);
    };
  }, [pathname]);

  return null;
}
