"use client";

import dynamic from "next/dynamic";

const BeforeAfterDeltaPanel = dynamic(
  () => import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
  { loading: () => null },
);

/** Reviews hub delta card — lazy chunk to keep RE First Load JS off the static graph. */
export function ReviewsHubBeforeAfterDeltaPanel() {
  return <BeforeAfterDeltaPanel variant="top" />;
}
