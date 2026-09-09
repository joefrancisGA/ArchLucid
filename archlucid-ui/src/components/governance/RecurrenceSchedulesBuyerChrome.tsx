"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RecurrenceSchedulesClaimOrientationStrip } from "./RecurrenceSchedulesClaimOrientationStrip";

/** Buyer default: mount Sources after primary schedule workspace (GRX). */
export function RecurrenceSchedulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="recurrence-schedules-orientation-bottom">
      <RecurrenceSchedulesClaimOrientationStrip />
    </div>
  );
}
