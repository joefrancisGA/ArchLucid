"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ManifestDetailClaimOrientationStrip } from "./ManifestDetailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the sealed record body (MMX). */
export function ManifestDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="sealed-record-detail-orientation-top">
      <ManifestDetailClaimOrientationStrip />
    </div>
  );
}
