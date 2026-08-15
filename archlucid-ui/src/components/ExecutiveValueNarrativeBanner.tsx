"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useMemo } from "react";

import { useComplianceDriftTrendRangeQuery } from "@/hooks/use-compliance-drift-trend-range-query";
import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";
import { useGovernancePrecommitBlockedCountQuery } from "@/hooks/use-governance-precommit-blocked-count-query";
import { usePilotValueReportQuery } from "@/hooks/use-pilot-value-report-query";
import {
  buildSponsorScorecardRecommendedActions,
  type SponsorScorecardRecommendedAction,
} from "@/lib/sponsor-scorecard-recommended-actions";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { buildSponsorValueNarrative } from "@/lib/sponsor-value-narrative";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  type SponsorTimeRange,
  windowForSponsorRange,
} from "@/lib/sponsor-time-range";
import { hoursSurfaced } from "@/lib/roi-assumptions";

const AVERAGE_MANUAL_REVIEW_HOURS = 3;

function sumDriftChanges(points: { changeCount: number }[]): number {
  return points.reduce((sum, point) => sum + (Number.isFinite(point.changeCount) ? point.changeCount : 0), 0);
}

function buildFallbackNarrativeFromSummary(summary: SponsorRoiSummary): string {
  const reviewsCount = summary.latestRunCount ?? summary.systemCount ?? 0;

  return buildSponsorValueNarrative({
    reviewsCount,
    findingsCount: 0,
    estimatedHoursSaved: reviewsCount * AVERAGE_MANUAL_REVIEW_HOURS,
    estimatedUsdSavings: summary.totalEstimatedUsdSavings ?? null,
    topRecommendedAction: null,
    qualifyEstimatedHours: isBuyerPolishedOperatorShellEnv(),
  });
}

export type SponsorValueNarrativeBannerProps = {
  readonly timeRange: SponsorTimeRange;
  readonly roiSummary?: SponsorRoiSummary | null;
};

/** Deterministic sponsor story line (TB-268). */
export function SponsorValueNarrativeBanner({ timeRange, roiSummary }: SponsorValueNarrativeBannerProps) {
  const window = useMemo(() => windowForSponsorRange(timeRange), [timeRange]);
  const reportQuery = usePilotValueReportQuery(window.fromUtc, window.toUtc);
  const report = reportQuery.data;

  const driftFromUtc = window.fromUtc ?? report?.fromUtc ?? "";
  const reportToUtc = report?.toUtc ?? window.toUtc;
  const reportFromUtc = report?.fromUtc ?? window.fromUtc ?? "";

  const driftQuery = useComplianceDriftTrendRangeQuery(driftFromUtc, reportToUtc, {
    enabled: report !== undefined,
  });
  const blockedQuery = useGovernancePrecommitBlockedCountQuery(reportFromUtc, reportToUtc, {
    enabled: report !== undefined,
  });
  const roiQuery = useSponsorRoiSummaryQuery({ enabled: roiSummary === undefined });

  const loading =
    reportQuery.isPending
    || (report !== undefined && (driftQuery.isPending || blockedQuery.isPending))
    || (roiSummary === undefined && roiQuery.isPending);

  const narrative = useMemo((): string | null => {
    if (reportQuery.isError) {
      if (roiSummary != null) {
        return buildFallbackNarrativeFromSummary(roiSummary);
      }

      return null;
    }

    if (report === undefined || driftQuery.data === undefined || blockedQuery.data === undefined) {
      return null;
    }

    const SponsorReport = roiSummary !== undefined ? roiSummary : roiQuery.data ?? null;

    const recommendedActions: SponsorScorecardRecommendedAction[] =
      buildSponsorScorecardRecommendedActions({
        complianceDriftChangeCount: sumDriftChanges(driftQuery.data),
        orphanCandidates: SponsorReport?.orphanCandidates,
        committedRunsTimeline: report.committedRunsTimeline,
      });

    const hoursRoi = hoursSurfaced({
      critical: report.findingsBySeverity.critical,
      high: report.findingsBySeverity.high,
      medium: report.findingsBySeverity.medium,
      precommitBlocks: blockedQuery.data.count,
    });

    const estimatedHours =
      hoursRoi > 0 ? hoursRoi : report.totalRunsCommitted * AVERAGE_MANUAL_REVIEW_HOURS;

    return buildSponsorValueNarrative({
      reviewsCount: report.totalRunsCommitted,
      findingsCount: report.totalFindings,
      estimatedHoursSaved: estimatedHours,
      estimatedUsdSavings: SponsorReport?.totalEstimatedUsdSavings ?? null,
      topRecommendedAction: recommendedActions[0] ?? null,
      qualifyEstimatedHours: isBuyerPolishedOperatorShellEnv(),
    });
  }, [
    blockedQuery.data,
    driftQuery.data,
    report,
    reportQuery.isError,
    roiQuery.data,
    roiSummary,
  ]);

  const displayText =
    narrative ??
    (loading ? "Preparing sponsor narrative…" : roiSummary != null ? buildFallbackNarrativeFromSummary(roiSummary) : null);

  if (displayText === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 leading-relaxed text-neutral-800 shadow-sm dark:border-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      data-testid="sponsor-value-narrative"
      role="status"
      aria-busy={loading ? "true" : undefined}
    >
      {displayText}
    </p>
  );
}
