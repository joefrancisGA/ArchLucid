"use client";

import { SponsorShellOrientationCallout } from "@/components/sponsor/SponsorShellOrientationCallout";
import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";

/** Non-critical sponsor shell affordances loaded after the frame paints. */
export function SponsorShellDeferredChrome() {
  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      <SponsorShellOrientationCallout />
    </>
  );
}
