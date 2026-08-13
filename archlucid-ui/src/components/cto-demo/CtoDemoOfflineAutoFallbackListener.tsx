"use client";

import { useEffect } from "react";

import {
  enableCtoDemoOfflineAutoFallback,
  shouldListenForCtoDemoOfflineAutoFallback,
} from "@/lib/cto-demo-offline-auto-fallback";
import { ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT } from "@/lib/buyer/buyer-cto-demo-tour";
import { ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT } from "@/lib/operator/operator-static-demo";

/** Auto-enables offline showcase payloads when the browser goes offline mid-demo. */
export function CtoDemoOfflineAutoFallbackListener(): null {
  useEffect(() => {
    function tryEnableOfflineFallback(): void {
      if (!shouldListenForCtoDemoOfflineAutoFallback()) {
        return;
      }

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        enableCtoDemoOfflineAutoFallback("browser-offline");
      }
    }

    function onOffline(): void {
      enableCtoDemoOfflineAutoFallback("browser-offline");
    }

    function onTourStarted(): void {
      tryEnableOfflineFallback();
    }

    function onPanicChanged(): void {
      tryEnableOfflineFallback();
    }

    tryEnableOfflineFallback();

    window.addEventListener("offline", onOffline);
    window.addEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onTourStarted);
    window.addEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, onPanicChanged);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onTourStarted);
      window.removeEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, onPanicChanged);
    };
  }, []);

  return null;
}
