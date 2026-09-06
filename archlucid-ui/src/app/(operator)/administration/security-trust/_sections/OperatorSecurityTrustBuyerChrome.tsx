"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { OperatorSecurityTrustClaimOrientationStrip } from "./OperatorSecurityTrustClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary security-trust workspace (WSX). */
export function OperatorSecurityTrustBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="operator-security-trust-orientation-bottom">
      <OperatorSecurityTrustClaimOrientationStrip />
    </div>
  );
}
