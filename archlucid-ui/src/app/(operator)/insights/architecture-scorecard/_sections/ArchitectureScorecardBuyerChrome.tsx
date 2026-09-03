"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitectureScorecardClaimOrientationStrip } from "./ArchitectureScorecardClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the scorecard body (SCX). */
export function ArchitectureScorecardBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-scorecard-orientation-top">
      <ArchitectureScorecardClaimOrientationStrip />
    </div>
  );
}
