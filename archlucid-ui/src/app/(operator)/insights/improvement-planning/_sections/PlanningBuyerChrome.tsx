"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PlanningClaimOrientationStrip } from "./PlanningClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function PlanningBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PlanningClaimOrientationStrip />;
}
