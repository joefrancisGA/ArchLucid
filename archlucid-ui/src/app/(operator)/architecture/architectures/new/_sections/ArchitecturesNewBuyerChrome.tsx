"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources on create-bootstrap (ANE). */
export function ArchitecturesNewBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-6 text-left" data-testid="architectures-new-orientation-top">
      <ArchitecturesNewClaimOrientationStrip />
    </div>
  );
}
