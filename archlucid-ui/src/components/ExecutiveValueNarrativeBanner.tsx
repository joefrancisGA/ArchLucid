"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import {
  buildExecutiveScorecardRecommendedActions,
  type ExecutiveScorecardRecommendedAction,
} from "@/lib/executive-scorecard-recommended-actions";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { buildExecutiveValueNarrative } from "@/lib/executive-value-narrative";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  type ExecutiveTimeRange,
  windowForExecutiveRange,
} from "@/lib/executive-time-range";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { hoursSurfaced } from "@/lib/roi-assumptions";
import { getComplianceDriftTrend } from "@/lib/api";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";

const AVERAGE_MANUAL_REVIEW_HOURS = 3;

async function fetchExecutiveRoiSummary(): Promise<ExecutiveRoiSummary | null> {
  try {
    const response = await fetch(
      `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ExecutiveRoiSummary;
  } catch {
    return null;
  }
}

function sumDriftChanges(points: { changeCount: number }[]): number {
  return points.reduce((sum, point) => sum + (Number.isFinite(point.changeCount) ? point.changeCount : 0), 0);
}

function buildFallbackNarrativeFromSummary(summary: ExecutiveRoiSummary): string {
  const reviewsCount = summary.latestRunCount ?? summary.systemCount ?? 0;

  return buildExecutiveValueNarrative({
    reviewsCount,
    findingsCount: 0,
    estimatedHoursSaved: reviewsCount * AVERAGE_MANUAL_REVIEW_HOURS,
    estimatedUsdSavings: summary.totalEstimatedUsdSavings ?? null,
    topRecommendedAction: null,
    qualifyEstimatedHours: isBuyerPolishedOperatorShellEnv(),
  });
}

export type ExecutiveValueNarrativeBannerProps = {
  readonly timeRange: ExecutiveTimeRange;
  readonly roiSummary?: ExecutiveRoiSummary | null;
};

/** Deterministic executive story line (TB-268). */
export function ExecutiveValueNarrativeBanner({ timeRange, roiSummary }: ExecutiveValueNarrativeBannerProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selected: ExecutiveTimeRange) => {
    const { fromUtc, toUtc } = windowForExecutiveRange(selected);

    setLoading(true);

    try {
      const report = await fetchPilotValueReportJson(fromUtc, toUtc);
      const driftFrom = fromUtc ?? report.fromUtc;

      const [driftPoints, blocked, executiveSummary] = await Promise.all([
        getComplianceDriftTrend(driftFrom, report.toUtc, 1440),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: report.fromUtc,
          toUtcIso: report.toUtc,
        }),
        roiSummary !== undefined ? Promise.resolve(roiSummary) : fetchExecutiveRoiSummary(),
      ]);

      const recommendedActions: ExecutiveScorecardRecommendedAction[] =
        buildExecutiveScorecardRecommendedActions({
          complianceDriftChangeCount: sumDriftChanges(driftPoints),
          orphanCandidates: executiveSummary?.orphanCandidates,
          committedRunsTimeline: report.committedRunsTimeline,
        });

      const hoursRoi = hoursSurfaced({
        critical: report.findingsBySeverity.critical,
        high: report.findingsBySeverity.high,
        medium: report.findingsBySeverity.medium,
        precommitBlocks: blocked.count,
      });

      const estimatedHours =
        hoursRoi > 0 ? hoursRoi : report.totalRunsCommitted * AVERAGE_MANUAL_REVIEW_HOURS;

      setNarrative(
        buildExecutiveValueNarrative({
          reviewsCount: report.totalRunsCommitted,
          findingsCount: report.totalFindings,
          estimatedHoursSaved: estimatedHours,
          estimatedUsdSavings: executiveSummary?.totalEstimatedUsdSavings ?? null,
          topRecommendedAction: recommendedActions[0] ?? null,
          qualifyEstimatedHours: isBuyerPolishedOperatorShellEnv(),
        }),
      );
    } catch {
      if (roiSummary !== undefined && roiSummary !== null) {
        setNarrative(buildFallbackNarrativeFromSummary(roiSummary));
      } else {
        setNarrative(null);
      }
    } finally {
      setLoading(false);
    }
  }, [roiSummary]);

  useEffect(() => {
    void load(timeRange);
  }, [load, timeRange]);

  const displayText =
    narrative ??
    (loading ? "Preparing executive narrative…" : roiSummary != null ? buildFallbackNarrativeFromSummary(roiSummary) : null);

  if (displayText === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 leading-relaxed text-neutral-800 shadow-sm dark:border-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      data-testid="executive-value-narrative"
      role="status"
      aria-busy={loading ? "true" : undefined}
    >
      {displayText}
    </p>
  );
}
