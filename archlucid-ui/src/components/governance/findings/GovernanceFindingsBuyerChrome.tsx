"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { GovernanceFindingsClaimOrientationStrip } from "./GovernanceFindingsClaimOrientationStrip";

/** Buyer default: mount Sources orientation after primary workspace findings queue body. */
export type GovernanceFindingsBuyerChromeProps = {
  readonly scopedRunId?: string | null;
};

export function GovernanceFindingsBuyerChrome(
  _props: GovernanceFindingsBuyerChromeProps = {},
): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="governance-findings-orientation-bottom">
      <GovernanceFindingsClaimOrientationStrip />
    </div>
  );
}
