"use client";

import { useEffect } from "react";

import { getStartCtoDemoTourHref, readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isCtoDemoExecutiveLandingEnv } from "@/lib/cto-demo-presenter-pack";

/** Redirects packaged demo home to the executive summary landing (#4). */
export function CtoDemoExecutiveLandingRedirect() {
  useEffect(() => {
    if (!isCtoDemoExecutiveLandingEnv()) {
      return;
    }

    if (!readBuyerCtoDemoTourActive()) {
      return;
    }

    window.location.replace(getStartCtoDemoTourHref());
  }, []);

  return null;
}
