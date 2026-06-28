"use client";

import { ExecutiveShellOrientationCallout } from "@/components/executive/ExecutiveShellOrientationCallout";

/** Non-critical executive shell affordances loaded after the frame paints. */
export function ExecutiveShellDeferredChrome() {
  return <ExecutiveShellOrientationCallout />;
}
