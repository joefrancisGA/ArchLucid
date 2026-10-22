"use client";

import { useEffect, useState } from "react";

import {
  ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT,
  readBuyerCtoDemoSpotlight,
} from "@/lib/buyer/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Dims the page so the audience follows the presenter on a shared screen. */
export function CtoDemoSpotlightOverlay(): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [spotlightOn, setSpotlightOn] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSpotlightOn(readBuyerCtoDemoSpotlight());

    function onSpotlightChanged(): void {
      setSpotlightOn(readBuyerCtoDemoSpotlight());
    }

    window.addEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, onSpotlightChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT, onSpotlightChanged);
    };
  }, []);

  if (!mounted || !isBuyerPolishedOperatorShellEnv() || !spotlightOn) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9980] bg-black/40 print:hidden"
      data-testid="cto-demo-spotlight-overlay"
      aria-hidden
    />
  );
}
