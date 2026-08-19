"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PolicyPacksClaimOrientationStrip } from "./PolicyPacksClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on the policy packs hub (GPP). */
export function PolicyPacksBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PolicyPacksClaimOrientationStrip />;
}
