"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PilotOutcomesClaimOrientationStrip } from "./PilotOutcomesClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above reporting period controls. */
export function PilotValueReportBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="pilot-outcomes-orientation-top">
      <PilotOutcomesClaimOrientationStrip />
    </div>
  );
}
