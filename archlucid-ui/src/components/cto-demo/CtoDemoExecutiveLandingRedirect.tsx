"use client";

import { useEffect } from "react";

import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoExecutiveLandingEnv } from "@/lib/cto-demo-presenter-pack";

/** Redirects packaged demo home to the executive summary landing (#4). */
export function CtoDemoExecutiveLandingRedirect() {
  useEffect(() => {
    if (!isCtoDemoExecutiveLandingEnv()) {
      return;
    }

    window.location.replace(getStartCtoDemoTourHref());
  }, []);

  return null;
}
