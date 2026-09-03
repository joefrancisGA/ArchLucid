"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RecurrenceSchedulesClaimOrientationStrip } from "./RecurrenceSchedulesClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary schedule workspace. */
export function RecurrenceSchedulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <RecurrenceSchedulesClaimOrientationStrip />;
}
