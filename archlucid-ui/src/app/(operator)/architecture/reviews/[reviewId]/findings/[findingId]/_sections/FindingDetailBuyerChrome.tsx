"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { FindingDetailClaimOrientationStrip } from "./FindingDetailClaimOrientationStrip";

export type FindingDetailBuyerChromeProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Buyer default: mount Sources orientation above finding summary inside first viewport (RRF). */
export function FindingDetailBuyerChrome(
  props: FindingDetailBuyerChromeProps,
): React.JSX.Element | null {
  const { productLine } = useProductLine();

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="finding-detail-orientation-top">
      <FindingDetailClaimOrientationStrip
        runId={props.runId}
        findingId={props.findingId}
        productLine={productLine}
      />
    </div>
  );
}
