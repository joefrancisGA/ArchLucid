"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AdministrationConnectionStatusClaimOrientationStrip } from "./AdministrationConnectionStatusClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary connection status workspace (ADC). */
export function AdministrationConnectionStatusBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="connection-status-orientation-bottom">
      <AdministrationConnectionStatusClaimOrientationStrip />
    </div>
  );
}
