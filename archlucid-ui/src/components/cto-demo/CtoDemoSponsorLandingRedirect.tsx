"use client";

import { useEffect } from "react";

import { getStartCtoDemoTourHref, readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isCtoDemoSponsorLandingEnv } from "@/lib/cto-demo-presenter-pack";

/** Redirects packaged demo home to the sponsor report landing (#4). */
export function CtoDemoSponsorLandingRedirect() {
  useEffect(() => {
    if (!isCtoDemoSponsorLandingEnv()) {
      return;
    }

    if (!readBuyerCtoDemoTourActive()) {
      return;
    }

    window.location.replace(getStartCtoDemoTourHref());
  }, []);

  return null;
}
