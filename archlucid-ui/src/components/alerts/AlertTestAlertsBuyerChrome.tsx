"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AlertTestAlertsClaimOrientationStrip } from "./AlertTestAlertsClaimOrientationStrip";

/** Buyer default: mount Sources orientation after primary Test alerts workspace (GOT). */
export function AlertTestAlertsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="alert-test-alerts-orientation-bottom">
      <AlertTestAlertsClaimOrientationStrip />
    </div>
  );
}
