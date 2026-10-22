"use client";

import { useEffect } from "react";

import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";

/** Scroll a mounted anchor into view when the location hash matches (mount + hashchange). */
export function useDeepLinkHashScroll(
  targetId: string,
  matchesHash: (hash: string) => boolean,
): void {
  useEffect(() => {
    const scrollIfMatched = () => {
      if (matchesHash(window.location.hash)) {
        scheduleScrollDeepLinkTargetIntoView(targetId);
      }
    };

    scrollIfMatched();
    window.addEventListener("hashchange", scrollIfMatched);

    return () => {
      window.removeEventListener("hashchange", scrollIfMatched);
    };
  }, [matchesHash, targetId]);
}
