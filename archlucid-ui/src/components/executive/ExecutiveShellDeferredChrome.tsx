"use client";

import { ExecutiveShellOrientationCallout } from "@/components/executive/ExecutiveShellOrientationCallout";
import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";

/** Non-critical executive shell affordances loaded after the frame paints. */
export function ExecutiveShellDeferredChrome() {
  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      <ExecutiveShellOrientationCallout />
    </>
  );
}
