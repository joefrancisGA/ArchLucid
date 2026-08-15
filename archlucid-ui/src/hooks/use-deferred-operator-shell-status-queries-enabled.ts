"use client";

import { useEffect, useState } from "react";

export const DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS = 500;

let sharedDeferredReady = false;
let sharedDeferredScheduled = false;
const sharedDeferredListeners = new Set<(ready: boolean) => void>();

function notifyDeferredShellStatusQueryListeners(): void {
  for (const listener of sharedDeferredListeners) {
    listener(true);
  }
}

function scheduleDeferredShellStatusQueries(): void {
  if (sharedDeferredScheduled || sharedDeferredReady) {
    return;
  }

  sharedDeferredScheduled = true;

  if (typeof window === "undefined") {
    return;
  }

  const markReady = (): void => {
    sharedDeferredReady = true;
    notifyDeferredShellStatusQueryListeners();
  };

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof idleWindow.requestIdleCallback === "function") {
    idleWindow.requestIdleCallback(markReady, {
      timeout: DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS,
    });

    return;
  }

  window.setTimeout(markReady, DEFERRED_SHELL_STATUS_QUERY_FALLBACK_MS);
}

/** Reset shared scheduler state between Vitest cases. */
export function resetDeferredOperatorShellStatusQueriesForTests(): void {
  sharedDeferredReady = false;
  sharedDeferredScheduled = false;
  sharedDeferredListeners.clear();
}

/**
 * Defers Tier-1 operator shell status queries until the browser is idle so `/me` and
 * health checks win the initial connection budget. All consumers share one idle callback.
 */
export function useDeferredOperatorShellStatusQueriesEnabled(): boolean {
  const [enabled, setEnabled] = useState(sharedDeferredReady);

  useEffect(() => {
    if (sharedDeferredReady) {
      setEnabled(true);

      return;
    }

    const onReady = (ready: boolean): void => {
      setEnabled(ready);
    };

    sharedDeferredListeners.add(onReady);
    scheduleDeferredShellStatusQueries();

    return () => {
      sharedDeferredListeners.delete(onReady);
    };
  }, []);

  return enabled;
}
