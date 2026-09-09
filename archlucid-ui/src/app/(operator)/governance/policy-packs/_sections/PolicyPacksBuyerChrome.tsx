"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PolicyPacksClaimOrientationStrip } from "./PolicyPacksClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources after primary workspace policy packs tabs (GPP). */
export function PolicyPacksBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="policy-packs-orientation-bottom">
      <PolicyPacksClaimOrientationStrip />
    </div>
  );
}
