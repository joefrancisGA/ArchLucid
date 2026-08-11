"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExecutiveNextActionInputsQuery } from "@/hooks/use-executive-next-action-inputs-query";
import { buildExecutiveScorecardRecommendedActions } from "@/lib/executive-scorecard-recommended-actions";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ExecutiveTimeRange } from "@/lib/executive-time-range";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
  // Shared cached query: summary identity changes no longer trigger a refetch — the summary only
  // feeds the local recommendation derivation below.
  const inputsQuery = useExecutiveNextActionInputsQuery(timeRange, { enabled: !loading });

  const action = useMemo(() => {
    if (inputsQuery.data === undefined) {
      return null;
    }

    const recommendedActions = buildExecutiveScorecardRecommendedActions({
      complianceDriftChangeCount: inputsQuery.data.complianceDriftChangeCount,
      orphanCandidates: summary?.orphanCandidates,
      committedRunsTimeline: inputsQuery.data.committedRunsTimeline,
    });

    return recommendedActions[0] ?? null;
  }, [inputsQuery.data, summary]);

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
        <Link href={action.href} className={cn("inline-flex", OPERATOR_LINK.inline)} data-testid="executive-dashboard-next-action-link">
          {v.nextActionLinkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
