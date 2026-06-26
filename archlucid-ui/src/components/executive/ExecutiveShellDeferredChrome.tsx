"use client";

import { ExecutiveShellOrientationCallout } from "@/components/executive/ExecutiveShellOrientationCallout";
import { LayerContextFromRoute } from "@/components/LayerContextFromRoute";

/** Non-critical executive shell affordances loaded after the frame paints. */
export function ExecutiveShellDeferredChrome() {
  return (
    <>
      <ExecutiveShellOrientationCallout />
      <LayerContextFromRoute />
    </>
  );
}
