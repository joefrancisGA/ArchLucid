"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ImpactPreviewClaimOrientationStrip } from "./ImpactPreviewClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function ImpactPreviewBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ImpactPreviewClaimOrientationStrip />;
}
