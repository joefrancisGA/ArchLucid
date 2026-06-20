"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplianceDriftTrend } from "@/lib/api";
import {
  buildExecutiveScorecardRecommendedActions,
  type ExecutiveScorecardRecommendedAction,
} from "@/lib/executive-scorecard-recommended-actions";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  type ExecutiveTimeRange,
  windowForExecutiveRange,
} from "@/lib/executive-time-range";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function sumDriftChanges(points: { changeCount: number }[]): number {
  return points.reduce((sum, point) => sum + (Number.isFinite(point.changeCount) ? point.changeCount : 0), 0);
}

export type ExecutiveDashboardNextActionSectionProps = {
  readonly timeRange: ExecutiveTimeRange;
  readonly summary: ExecutiveRoiSummary | null;
  readonly loading: boolean;
};

/** Surfaces the highest-priority executive next step above detailed metrics. */
export function ExecutiveDashboardNextActionSection(
  props: ExecutiveDashboardNextActionSectionProps,
): React.JSX.Element | null {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const { timeRange, summary, loading } = props;
  const [action, setAction] = useState<ExecutiveScorecardRecommendedAction | null>(null);

  const load = useCallback(async (selected: ExecutiveTimeRange, roiSummary: ExecutiveRoiSummary | null) => {
    const { fromUtc, toUtc } = windowForExecutiveRange(selected);

    try {
      const report = await fetchPilotValueReportJson(fromUtc, toUtc);
      const driftFrom = fromUtc ?? report.fromUtc;
      const driftPoints = await getComplianceDriftTrend(driftFrom, report.toUtc, 1440);
      const recommendedActions = buildExecutiveScorecardRecommendedActions({
        complianceDriftChangeCount: sumDriftChanges(driftPoints),
        orphanCandidates: roiSummary?.orphanCandidates,
        committedRunsTimeline: report.committedRunsTimeline,
      });

      setAction(recommendedActions[0] ?? null);
    } catch {
      setAction(null);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    void load(timeRange, summary);
  }, [load, loading, summary, timeRange]);

  if (loading || action === null) {
    return null;
  }

  return (
    <Card data-testid="executive-dashboard-next-action">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{v.nextActionSectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">{action.headline}</p>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">{action.explanation}</p>
        <Link
          href={action.href}
          className="inline-flex text-sm font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          Open in operator view
        </Link>
      </CardContent>
    </Card>
  );
}
