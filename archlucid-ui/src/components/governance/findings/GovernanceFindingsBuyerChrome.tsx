"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ReviewPackageGovernanceFindingsVocabularyRail } from "@/components/ReviewPackageGovernanceFindingsVocabularyRail";

import { GovernanceFindingsClaimOrientationStrip } from "./GovernanceFindingsClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the findings queue body. */
export type GovernanceFindingsBuyerChromeProps = {
  readonly scopedRunId?: string | null;
};

export function GovernanceFindingsBuyerChrome(
  props: GovernanceFindingsBuyerChromeProps = {},
): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="governance-findings-orientation-top">
      <ReviewPackageGovernanceFindingsVocabularyRail
        runId={props.scopedRunId}
        currentSurfaceId="governance-findings-queue"
      />
      <GovernanceFindingsClaimOrientationStrip />
    </div>
  );
}
