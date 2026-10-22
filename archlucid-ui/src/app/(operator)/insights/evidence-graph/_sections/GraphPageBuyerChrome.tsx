"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { EvidenceGraphClaimOrientationStrip } from "./EvidenceGraphClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources after primary workspace evidence graph body (GRA). */
export function GraphPageBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="evidence-graph-orientation-top">
      <EvidenceGraphClaimOrientationStrip />
    </div>
  );
}
