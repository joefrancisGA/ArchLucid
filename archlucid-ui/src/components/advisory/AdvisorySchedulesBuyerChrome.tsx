"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AdvisorySchedulesClaimOrientationStrip } from "./AdvisorySchedulesClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary advisory schedules workspace (AD). */
export function AdvisorySchedulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="advisory-schedules-orientation-bottom">
      <AdvisorySchedulesClaimOrientationStrip />
    </div>
  );
}
