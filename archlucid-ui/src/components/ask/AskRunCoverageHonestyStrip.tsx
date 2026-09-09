"use client";

import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";
import { useAskRunCoverageHonestyQuery } from "@/hooks/use-ask-run-coverage-honesty-query";
import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AskRunCoverageHonestyStripProps = {
  readonly runId: string;
};

/** Hoists quiet-engine / skipped-MUST honesty above Ask when a package is selected (WA-07). */
export function AskRunCoverageHonestyStrip(props: AskRunCoverageHonestyStripProps): ReactElement | null {
  const trimmedRunId = props.runId.trim();
  const query = useAskRunCoverageHonestyQuery(trimmedRunId, {
    enabled: trimmedRunId.length > 0,
  });

  if (trimmedRunId.length === 0) {
    return null;
  }

  if (query.isError) {
    return (
      <div className="mb-4 space-y-2" data-testid="ask-run-coverage-honesty-blocked">
        {query.failure ? <OperatorApiProblem failure={query.failure} variant="warning" /> : null}
        {query.blockedReason ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{query.blockedReason}</p>
        ) : null}
      </div>
    );
  }

  if (query.data === undefined) {
    return null;
  }

  const progressSummary = query.data.progressSummary;

  return (
    <RunDetailSealDeskCoverageStrip
      runId={trimmedRunId}
      analysisStagesComplete={analysisStagesCompleteOnSummary(progressSummary)}
      graphSnapshot={query.data.buyerSummary.graphSnapshot}
      transparencyTrail={
        query.data.manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null
      }
      className="mb-4"
    />
  );
}
