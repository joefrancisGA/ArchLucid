"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { DecisionRegisterClaimOrientationStrip } from "./DecisionRegisterClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on the decision register (GDO). */
export function DecisionRegisterBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <DecisionRegisterClaimOrientationStrip />;
}
