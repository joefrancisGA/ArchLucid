"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { RunDetailClaimOrientationStrip } from "./RunDetailClaimOrientationStrip";

export type RunDetailBuyerChromeProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Buyer default: mount Sources orientation above review workspace tabs (RRE). */
export function RunDetailBuyerChrome(props: RunDetailBuyerChromeProps): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="review-detail-orientation-top">
      <RunDetailClaimOrientationStrip runId={props.runId} architectureId={props.architectureId} />
    </div>
  );
}
