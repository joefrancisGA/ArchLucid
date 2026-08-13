"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  helpTopicSlugFromPathname,
  resolveHelpTopicHashFragment,
} from "@/lib/help/help-topic-hash-aliases";

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

function focusHashTarget(target: HTMLElement): void {
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus({ preventScroll: true });
}

function scrollToHashFragment(pathname: string): void {
  const rawHash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "").trim() : "";

  if (rawHash.length === 0) {
    return;
  }

  const topicSlug = helpTopicSlugFromPathname(pathname);
  const hash = resolveHelpTopicHashFragment(topicSlug, rawHash);

  if (hash !== rawHash && typeof window !== "undefined") {
    const nextUrl = `${window.location.pathname}${window.location.search}#${hash}`;

    window.history.replaceState(window.history.state, "", nextUrl);
  }

  const target = document.getElementById(hash);

  if (target === null) {
    return;
  }

  // Defer DOM opens until after mount so HelpLazyDetails toggle handlers do not setState mid-commit.
  requestAnimationFrame(() => {
    // Expand collapsed help disclosures so TOC / search deep links are not hidden (TB-1043).
    openSectionDetails(target);
    window.dispatchEvent(new Event("archlucid:help-hash-scroll"));

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      focusHashTarget(target);
    });
  });
}

/** Scrolls to `#fragment` after documentation search or in-page hash navigation. */
export function HelpTopicHashScroll(): null {
  const pathname = usePathname();

  useEffect(() => {
    scrollToHashFragment(pathname);

    const onHashChange = (): void => {
      scrollToHashFragment(pathname);
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname]);

  return null;
}
