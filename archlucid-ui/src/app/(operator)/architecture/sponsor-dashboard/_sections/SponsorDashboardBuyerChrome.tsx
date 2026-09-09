"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitectureSponsorDashboardClaimOrientationStrip } from "./ArchitectureSponsorDashboardClaimOrientationStrip";

/** Buyer default: mount Sources orientation above sponsor workspace inside first viewport (ARE). */
export function SponsorDashboardBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="architecture-sponsor-dashboard-orientation-top">
      <ArchitectureSponsorDashboardClaimOrientationStrip />
    </div>
  );
}
