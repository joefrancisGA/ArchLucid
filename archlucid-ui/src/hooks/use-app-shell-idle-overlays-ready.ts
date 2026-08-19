"use client";

import { useEffect, useState } from "react";

const IDLE_OVERLAY_FALLBACK_MS = 1200;

/** True after the browser is idle enough to mount tour/wizard/demo shell overlays (TB-696). */
export function useAppShellIdleOverlaysReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const markReady = (): void => {
      setReady(true);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const handle = idleWindow.requestIdleCallback(markReady, { timeout: IDLE_OVERLAY_FALLBACK_MS });

      return () => {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(handle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(markReady, IDLE_OVERLAY_FALLBACK_MS);

    return () => {
      window.clearTimeout(timeoutHandle);
    };
  }, []);

  return ready;
}
