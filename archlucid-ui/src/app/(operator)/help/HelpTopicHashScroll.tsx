"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function openAncestorDetails(element: HTMLElement): void {
  let ancestor: HTMLElement | null = element;

  while (ancestor !== null) {
    if (ancestor instanceof HTMLDetailsElement) {
      ancestor.open = true;
    }

    ancestor = ancestor.parentElement;
  }
}

function openSectionDetails(element: HTMLElement): void {
  openAncestorDetails(element);

  const section = element.closest("section");

  if (section === null) {
    return;
  }

  // Heading ids often sit above collapsed bodies — open sibling disclosures in the same section.
  const nestedDetails = section.querySelectorAll("details");

  for (const details of nestedDetails) {
    details.open = true;
  }
}

function scrollToHashFragment(): void {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "").trim() : "";

  if (hash.length === 0) {
    return;
  }

  const target = document.getElementById(hash);

  if (target === null) {
    return;
  }

  // Expand collapsed help disclosures so TOC / search deep links are not hidden (TB-1043).
  openSectionDetails(target);

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
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
