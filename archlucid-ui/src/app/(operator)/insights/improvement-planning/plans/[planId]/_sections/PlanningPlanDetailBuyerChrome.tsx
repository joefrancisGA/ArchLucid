"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PlanningPlanDetailClaimOrientationStrip } from "./PlanningPlanDetailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function PlanningPlanDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PlanningPlanDetailClaimOrientationStrip />;
}
