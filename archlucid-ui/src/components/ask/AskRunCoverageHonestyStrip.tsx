"use client";

import type { ReactElement } from "react";

import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";
import { useAskRunCoverageHonestyQuery } from "@/hooks/use-ask-run-coverage-honesty-query";
import { analysisStagesCompleteOnSummary } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/pipeline-complete-on-summary";

export type AskRunCoverageHonestyStripProps = {
  readonly runId: string;
};

/** Hoists quiet-engine / skipped-MUST honesty above Ask when a package is selected (WA-07). */
export function AskRunCoverageHonestyStrip(props: AskRunCoverageHonestyStripProps): ReactElement | null {
  const trimmedRunId = props.runId.trim();
  const query = useAskRunCoverageHonestyQuery(trimmedRunId, {
    enabled: trimmedRunId.length > 0,
  });

  if (trimmedRunId.length === 0 || query.data === undefined) {
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
