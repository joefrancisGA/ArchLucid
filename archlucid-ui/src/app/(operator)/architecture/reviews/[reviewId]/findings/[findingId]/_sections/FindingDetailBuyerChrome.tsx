"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { FindingDetailClaimOrientationStrip } from "./FindingDetailClaimOrientationStrip";

export type FindingDetailBuyerChromeProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Buyer default: mount claim discipline + Sources above the finding summary body (RRF). */
export function FindingDetailBuyerChrome(
  props: FindingDetailBuyerChromeProps,
): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="finding-detail-orientation-top">
      <FindingDetailClaimOrientationStrip runId={props.runId} findingId={props.findingId} />
    </div>
  );
}
