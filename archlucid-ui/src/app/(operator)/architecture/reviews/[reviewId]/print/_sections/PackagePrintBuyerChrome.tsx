"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { PackagePrintClaimOrientationStrip } from "./PackagePrintClaimOrientationStrip";

export type PackagePrintBuyerChromeProps = {
  readonly runId: string;
};

/** Buyer default: mount claim discipline + Sources above print summary inside first viewport (APR). */
export function PackagePrintBuyerChrome(props: PackagePrintBuyerChromeProps): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="package-print-orientation-top">
      <PackagePrintClaimOrientationStrip runId={props.runId} />
    </div>
  );
}
