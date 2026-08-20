"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AlertsInboxClaimOrientationStrip } from "@/components/alerts/AlertsInboxClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources after primary workspace alert inbox body. */
export function AlertsHubBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="alerts-inbox-orientation-top">
      <AlertsInboxClaimOrientationStrip />
    </div>
  );
}
