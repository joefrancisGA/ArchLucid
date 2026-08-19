"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PackagePrintClaimOrientationStrip } from "./PackagePrintClaimOrientationStrip";

export type PackagePrintBuyerChromeProps = {
  readonly runId: string;
};

/** Buyer default: mount claim discipline + Sources on package print (APR). */
export function PackagePrintBuyerChrome(props: PackagePrintBuyerChromeProps): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PackagePrintClaimOrientationStrip runId={props.runId} />;
}
