"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PatternLibraryClaimOrientationStrip } from "./PatternLibraryClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function PatternLibraryBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PatternLibraryClaimOrientationStrip />;
}
