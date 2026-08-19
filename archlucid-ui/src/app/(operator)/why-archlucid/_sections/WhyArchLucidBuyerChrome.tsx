"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { WhyArchLucidClaimOrientationStrip } from "./WhyArchLucidClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function WhyArchLucidBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <WhyArchLucidClaimOrientationStrip />;
}
