"use client";

import { NotificationPreferenceCenterEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount claim discipline + Sources above the notifications workspace body (ADN). */
export function NotificationPreferenceCenterBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="notification-preference-center-orientation-top">
      <NotificationPreferenceCenterEvidenceOrientationStrip />
    </div>
  );
}
