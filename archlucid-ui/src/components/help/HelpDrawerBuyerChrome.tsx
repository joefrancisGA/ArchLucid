"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { HelpDrawerClaimOrientationStrip } from "./HelpDrawerClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources in the contextual help drawer. */
export function HelpDrawerBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <HelpDrawerClaimOrientationStrip />;
}
