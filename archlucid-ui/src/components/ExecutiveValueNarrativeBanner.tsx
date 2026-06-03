"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import {
  buildExecutiveScorecardRecommendedActions,
  type ExecutiveScorecardRecommendedAction,
} from "@/lib/executive-scorecard-recommended-actions";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { buildExecutiveValueNarrative } from "@/lib/executive-value-narrative";
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

export type ExecutiveValueNarrativeBannerProps = {
  readonly timeRange: ExecutiveTimeRange;
};

/** Deterministic executive story line (TB-268). */
export function ExecutiveValueNarrativeBanner({ timeRange }: ExecutiveValueNarrativeBannerProps) {
  const [narrative, setNarrative] = useState<string | null>(null);

  const load = useCallback(async (selected: ExecutiveTimeRange) => {
    const { fromUtc, toUtc } = windowForExecutiveRange(selected);

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
        fetchExecutiveRoiSummary(),
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
        }),
      );
    } catch {
      setNarrative(null);
    }
  }, []);

  useEffect(() => {
    void load(timeRange);
  }, [load, timeRange]);

  if (narrative === null) {
    return null;
  }

  return (
    <p
      className="m-0 rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm leading-relaxed text-neutral-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-neutral-200"
      data-testid="executive-value-narrative"
    >
      {narrative}
    </p>
  );
}
