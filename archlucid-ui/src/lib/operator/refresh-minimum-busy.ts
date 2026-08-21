"use client";

import { useEffect, useRef, useState } from "react";

/** Minimum time refresh controls stay visibly busy so operators notice the click registered. */
export const REFRESH_MINIMUM_BUSY_MS = 200;

/**
 * Extends a parent busy flag so the refresh affordance stays active for at least {@link REFRESH_MINIMUM_BUSY_MS}
 * from when busy first became true. Slow refreshes that already exceed the minimum release immediately.
 */
export function useMinimumBusyFeedback(
  busy: boolean,
  minimumMs: number = REFRESH_MINIMUM_BUSY_MS,
): boolean {
  const previousBusyRef = useRef(false);
  const activeUntilRef = useRef<number | null>(null);
  const [, setReleaseTick] = useState(0);

  if (busy && !previousBusyRef.current) {
    activeUntilRef.current = Date.now() + minimumMs;
  }

  previousBusyRef.current = busy;

  const isActive =
    busy || (activeUntilRef.current !== null && Date.now() < activeUntilRef.current);

  useEffect(() => {
    if (isActive) {
      const remainingMs = activeUntilRef.current! - Date.now();

      if (remainingMs <= 0) {
        activeUntilRef.current = null;
        setReleaseTick((tick) => tick + 1);

        return;
      }

      const timerId = window.setTimeout(() => {
        activeUntilRef.current = null;
        setReleaseTick((tick) => tick + 1);
      }, remainingMs);

      return () => {
        window.clearTimeout(timerId);
      };
    }

    if (!busy) {
      activeUntilRef.current = null;
    }

    return undefined;
  }, [busy, isActive]);

  return isActive;
}
