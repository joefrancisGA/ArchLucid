"use client";

import { useEffect, useState } from "react";

const DEFERRED_NAV_BADGE_QUERY_FALLBACK_MS = 500;

/**
 * Defers sidebar nav badge queries until the browser is idle so shell-critical reads
 * (`/me`, health, trial status) win the initial connection budget.
 */
export function useDeferredOperatorShellNavBadgeQueryEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const markEnabled = (): void => {
      setEnabled(true);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const handle = idleWindow.requestIdleCallback(markEnabled, {
        timeout: DEFERRED_NAV_BADGE_QUERY_FALLBACK_MS,
      });

      return () => {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(handle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(markEnabled, DEFERRED_NAV_BADGE_QUERY_FALLBACK_MS);

    return () => {
      window.clearTimeout(timeoutHandle);
    };
  }, []);

  return enabled;
}
