"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSponsorNextActionInputsQuery } from "@/hooks/use-sponsor-next-action-inputs-query";
import { buildSponsorScorecardRecommendedActions } from "@/lib/sponsor-scorecard-recommended-actions";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import type { SponsorTimeRange } from "@/lib/sponsor-time-range";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type SponsorDashboardNextActionSectionProps = {
  readonly timeRange: SponsorTimeRange;
  readonly summary: SponsorRoiSummary | null;
  readonly loading: boolean;
};

/** Surfaces the highest-priority sponsor next step above detailed metrics. */
export function SponsorDashboardNextActionSection(
  props: SponsorDashboardNextActionSectionProps,
): React.JSX.Element | null {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const { timeRange, summary, loading } = props;
  // Shared cached query: summary identity changes no longer trigger a refetch — the summary only
  // feeds the local recommendation derivation below.
  const inputsQuery = useSponsorNextActionInputsQuery(timeRange, { enabled: !loading });

  const action = useMemo(() => {
    if (inputsQuery.data === undefined) {
      return null;
    }

    const recommendedActions = buildSponsorScorecardRecommendedActions({
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
    <Card data-testid="sponsor-dashboard-next-action">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{v.nextActionSectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{action.headline}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{action.explanation}</p>
        <Link href={action.href} className={cn("inline-flex", OPERATOR_LINK.inline)} data-testid="sponsor-dashboard-next-action-link">
          {v.nextActionLinkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
