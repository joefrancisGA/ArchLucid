"use client";

import type { ReactElement } from "react";

import { RunDetailInfeasibleDecisionLead } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailInfeasibleDecisionLead";
import { AskRunCoverageHonestyStrip } from "@/components/ask/AskRunCoverageHonestyStrip";
import { useAskRunCoverageHonestyQuery } from "@/hooks/use-ask-run-coverage-honesty-query";
import { sponsorReviewCoverageHonestyApplies } from "@/lib/sponsor/sponsor-review-coverage-honesty";

export type SponsorDashboardReviewCoverageHonestyStripProps = {
  readonly runId: string;
};

/** Hoists quiet-engine / skipped-MUST / infeasible honesty above sponsor KPIs (WA-08). */
export function SponsorDashboardReviewCoverageHonestyStrip(
  props: SponsorDashboardReviewCoverageHonestyStripProps,
): ReactElement | null {
  const trimmedRunId = props.runId.trim();
  const query = useAskRunCoverageHonestyQuery(trimmedRunId, {
    enabled: trimmedRunId.length > 0,
  });

  if (trimmedRunId.length === 0 || query.data === undefined) {
    return null;
  }

  const inputs = {
    runId: trimmedRunId,
    progressSummary: query.data.progressSummary,
    manifestSummary: query.data.manifestSummary,
    graphSnapshot: query.data.buyerSummary.graphSnapshot,
  };

  if (!sponsorReviewCoverageHonestyApplies(inputs)) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="sponsor-dashboard-review-coverage-honesty">
      <RunDetailInfeasibleDecisionLead
        feasibilityVerdict={query.data.manifestSummary?.feasibilityVerdict ?? null}
        runId={trimmedRunId}
      />
      <AskRunCoverageHonestyStrip runId={trimmedRunId} />
    </div>
  );
}
