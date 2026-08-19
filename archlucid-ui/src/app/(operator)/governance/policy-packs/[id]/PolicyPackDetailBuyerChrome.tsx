"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PolicyPackDetailClaimOrientationStrip } from "./PolicyPackDetailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the pack detail body (GPI). */
export function PolicyPackDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="px-4" data-testid="policy-pack-detail-orientation-top">
      <PolicyPackDetailClaimOrientationStrip />
    </div>
  );
}
