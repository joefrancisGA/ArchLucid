"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Returns true when the observed element is not intersecting the viewport.
 * Falls back to false when IntersectionObserver is unavailable (e.g. jsdom).
 */
export function useElementOutOfView(
  elementRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [isOutOfView, setIsOutOfView] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsOutOfView(false);

      return;
    }

    const element = elementRef.current;

    if (element === null) {
      setIsOutOfView(false);

      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsOutOfView(false);

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry === undefined) {
          return;
        }

        setIsOutOfView(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, enabled]);

  return isOutOfView;
}
