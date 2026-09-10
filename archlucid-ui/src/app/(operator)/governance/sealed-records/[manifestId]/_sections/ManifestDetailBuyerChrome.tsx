"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ManifestDetailClaimOrientationStrip } from "./ManifestDetailClaimOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary finalized-record body (MMX). */
export function ManifestDetailBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="sealed-record-detail-orientation-bottom">
      <ManifestDetailClaimOrientationStrip />
    </div>
  );
}
