"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitecturesHubClaimOrientationStrip } from "./ArchitecturesHubClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function ArchitecturesHubBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ArchitecturesHubClaimOrientationStrip />;
}
