"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { GovernanceFindingsClaimOrientationStrip } from "./GovernanceFindingsClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the findings queue body. */
export function GovernanceFindingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="governance-findings-orientation-top">
      <GovernanceFindingsClaimOrientationStrip />
    </div>
  );
}
