"use client";

import dynamic from "next/dynamic";

const ExecutiveShellOrientationCallout = dynamic(
  () =>
    import("@/components/executive/ExecutiveShellOrientationCallout").then(
      (module) => module.ExecutiveShellOrientationCallout,
    ),
  { loading: () => null },
);

const LayerContextFromRoute = dynamic(
  () => import("@/components/LayerContextFromRoute").then((module) => module.LayerContextFromRoute),
  { loading: () => null },
);

/** Non-critical executive shell affordances loaded after the frame paints. */
export function ExecutiveShellDeferredChrome() {
  return (
    <>
      <ExecutiveShellOrientationCallout />
      <LayerContextFromRoute />
    </>
  );
}
