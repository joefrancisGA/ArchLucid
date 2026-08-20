"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitecturesHubClaimOrientationStrip } from "./ArchitecturesHubClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources after primary workspace draft list. */
export function ArchitecturesHubBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ArchitecturesHubClaimOrientationStrip />;
}
