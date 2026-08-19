"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RiskExceptionsClaimOrientationStrip } from "./RiskExceptionsClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on the risk exceptions register (GRO). */
export function RiskExceptionsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <RiskExceptionsClaimOrientationStrip />;
}
