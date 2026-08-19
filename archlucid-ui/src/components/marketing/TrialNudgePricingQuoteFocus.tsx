"use client";

import { useEffect } from "react";

/** Scrolls to the quote panel when the operator arrives from the trial upgrade nudge. */
export function TrialNudgePricingQuoteFocus({ quoteSectionDomId }: { quoteSectionDomId: string }) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.getElementById(quoteSectionDomId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [quoteSectionDomId]);

  return null;
}
