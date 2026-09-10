"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AlertRoutingClaimOrientationStrip } from "./AlertRoutingClaimOrientationStrip";

/** Buyer default: mount Sources orientation after primary Notifications workspace (GON). */
export function AlertRoutingBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="alert-routing-orientation-bottom">
      <AlertRoutingClaimOrientationStrip />
    </div>
  );
}
