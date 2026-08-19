"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PatternLibraryDetailClaimOrientationStrip } from "./PatternLibraryDetailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function PatternLibraryDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PatternLibraryDetailClaimOrientationStrip />;
}
