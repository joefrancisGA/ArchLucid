"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RoiSummaryClaimOrientationStrip } from "./RoiSummaryClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources after primary workspace ROI metrics (SPR). */
export function RoiSummaryBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="roi-summary-orientation-top">
      <RoiSummaryClaimOrientationStrip />
    </div>
  );
}
