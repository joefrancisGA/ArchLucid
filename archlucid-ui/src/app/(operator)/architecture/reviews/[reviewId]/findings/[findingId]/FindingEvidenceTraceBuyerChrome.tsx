"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { FindingEvidenceTraceClaimOrientationStrip } from "./FindingEvidenceTraceClaimOrientationStrip";

export type FindingEvidenceTraceBuyerChromeProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Buyer default: mount claim discipline + Sources on finding evidence-trace (ERU). */
export function FindingEvidenceTraceBuyerChrome(
  props: FindingEvidenceTraceBuyerChromeProps,
): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <FindingEvidenceTraceClaimOrientationStrip runId={props.runId} findingId={props.findingId} />
  );
}
