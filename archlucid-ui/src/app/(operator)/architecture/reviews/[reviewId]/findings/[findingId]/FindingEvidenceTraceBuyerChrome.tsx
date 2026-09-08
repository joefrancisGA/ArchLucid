"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { FindingEvidenceTraceClaimOrientationStrip } from "./FindingEvidenceTraceClaimOrientationStrip";

export type FindingEvidenceTraceBuyerChromeProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Buyer default: mount Sources orientation above evidence trace body inside first viewport (ERU). */
export function FindingEvidenceTraceBuyerChrome(
  props: FindingEvidenceTraceBuyerChromeProps,
): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="evidence-trace-orientation-top">
      <FindingEvidenceTraceClaimOrientationStrip runId={props.runId} findingId={props.findingId} />
    </div>
  );
}
