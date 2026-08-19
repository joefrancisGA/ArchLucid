"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitectureDraftDetailClaimOrientationStrip } from "./ArchitectureDraftDetailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on saved draft detail (ARR). */
export function ArchitectureDraftDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ArchitectureDraftDetailClaimOrientationStrip />;
}
