"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { GovernanceSetupClaimOrientationStrip } from "./GovernanceSetupClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary setup workspace (GFX). */
export function GovernanceSetupBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="governance-setup-orientation-bottom">
      <GovernanceSetupClaimOrientationStrip />
    </div>
  );
}
