"use client";
import { cn } from "@/lib/utils";

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
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{action.headline}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{action.explanation}</p>
        <Link
          href={action.href}
          className={cn("inline-flex", OPERATOR_LINK.inline)}
        >
          Open in operator view
        </Link>
      </CardContent>
    </Card>
  );
}
