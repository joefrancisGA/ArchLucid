"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ProvenanceClaimOrientationStrip } from "./ProvenanceClaimOrientationStrip";

export type ProvenanceBuyerChromeProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Buyer default: mount Sources follow-ups after primary review provenance workspace (RRP). */
export function ProvenanceBuyerChrome(props: ProvenanceBuyerChromeProps): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="provenance-orientation-bottom">
      <ProvenanceClaimOrientationStrip runId={props.runId} architectureId={props.architectureId} />
    </div>
  );
}
