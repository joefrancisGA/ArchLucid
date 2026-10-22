"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PolicyPackDetailClaimOrientationStrip } from "./PolicyPackDetailClaimOrientationStrip";

/** Buyer default: mount Sources after pack detail body (GPI). */
export function PolicyPackDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 px-4 text-left" data-testid="policy-pack-detail-orientation-bottom">
      <PolicyPackDetailClaimOrientationStrip />
    </div>
  );
}
