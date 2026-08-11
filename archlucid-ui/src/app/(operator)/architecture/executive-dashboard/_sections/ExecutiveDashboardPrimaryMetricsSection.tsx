"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";
import { formatMetricCountScopeLabel } from "@/lib/metric-count-presentation";
import {
  presentCostEvidenceFreshness,
  presentExecutiveKpiCount,
} from "@/lib/executive-roi-kpi-display";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  buildExecutiveServerSavingsSummary,
  resolveRunSavingsUsd,
} from "@/lib/roi-resolution-priority";
import { presentExecutiveEstimatedSavings } from "@/lib/executive-estimated-savings-display";

export type ExecutiveDashboardPrimaryMetricsSectionProps = {
  readonly summary: ExecutiveRoiSummary | null;
  readonly loading: boolean;
};

/** Top-tier executive metrics: risk posture, ROI impact, governance readiness. */
export function ExecutiveDashboardPrimaryMetricsSection(
  props: ExecutiveDashboardPrimaryMetricsSectionProps,
): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const { summary, loading } = props;
  const [decisionsNeededCount, setDecisionsNeededCount] = useState<number | null>(null);
  const [staleRiskCount, setStaleRiskCount] = useState<number | null>(null);
  const [expiringWaiversCount, setExpiringWaiversCount] = useState<number | null>(null);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      try {
        const decisionsNeeded = await getGovernanceDecisionsNeededSummary();

        if (!cancelled) {
          setDecisionsNeededCount(decisionsNeeded.totalDecisionItems);
          setStaleRiskCount(
            summary?.staleArchitectureRiskCount ?? decisionsNeeded.staleRisks,
          );
          setExpiringWaiversCount(decisionsNeeded.waiversExpiringWithin14Days);
        }
      } catch {
        if (!cancelled) {
          setDecisionsNeededCount(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, summary?.staleArchitectureRiskCount]);

  const decisionsNeeded = presentExecutiveKpiCount(
    loading ? undefined : decisionsNeededCount ?? undefined,
    { loading, suppressZeroFootnote: true },
  );
  const staleRisks = presentExecutiveKpiCount(loading ? undefined : staleRiskCount ?? undefined, {
    loading,
    suppressZeroFootnote: true,
  });
  const expiringWaivers = presentExecutiveKpiCount(
    loading ? undefined : expiringWaiversCount ?? undefined,
    { loading, suppressZeroFootnote: true },
  );
  const costFreshness = presentCostEvidenceFreshness({
    loading,
    status: summary?.costEvidenceFreshnessStatus,
    savingsPricingBasis: summary?.savingsPricingBasis,
    staleAfterDays: summary?.costEvidenceStaleAfterDays,
    executiveSurface: true,
  });
  const estimatedSavings = presentExecutiveEstimatedSavings(
    resolveRunSavingsUsd({
      serverSummary: buildExecutiveServerSavingsSummary(
        summary?.totalEstimatedUsdSavings,
        summary?.savingsPricingBasisDescription,
      ),
    })?.annualizedUsd ?? summary?.totalEstimatedUsdSavings,
    { loading, summary },
  );

  return (
    <section aria-labelledby="executive-primary-metrics-heading" className="space-y-3">
      <h2 id="executive-primary-metrics-heading" className="sr-only">
        {v.primaryMetricsSectionSrOnly}
      </h2>
      <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{v.primaryMetricsSectionTitle}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="executive-primary-decisions-needed">
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              {v.decisionsNeededMetric.title}
            </CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.decisionsNeededMetric.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={EXECUTIVE_KPI_DRILL_THROUGH.decisionsNeeded}
              className="block rounded-sm outline-none transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <p className={cn(OPERATOR_TYPOGRAPHY.executiveDashboardMetric, OPERATOR_LINK.nav)}>{decisionsNeeded.display}</p>
            </Link>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              {formatMetricCountScopeLabel([
                { kind: "workspace" },
                { kind: "governance-filter", filter: "all" },
              ])}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="executive-primary-risk-posture">
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Risk posture
            </CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
              Stale architecture risks and waivers expiring within 14 days
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">{v.staleArchitectureRisksMetric.title}</span>
              <Link href={EXECUTIVE_KPI_DRILL_THROUGH.staleArchitectureRisks} className={cn(OPERATOR_LINK.nav, "shrink-0 tabular-nums")}>
                {staleRisks.display}
              </Link>
            </div>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              {formatMetricCountScopeLabel([
                { kind: "workspace" },
                { kind: "governance-filter", filter: "stale" },
              ])}
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">{v.expiringWaiversMetric.title}</span>
              <Link href={EXECUTIVE_KPI_DRILL_THROUGH.expiringWaivers} className={cn(OPERATOR_LINK.nav, "shrink-0 tabular-nums")}>
                {expiringWaivers.display}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="executive-primary-roi-impact">
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Estimated savings
            </CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
              Directional portfolio impact from committed reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{estimatedSavings.display}</p>
            {estimatedSavings.footnote ? (
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{estimatedSavings.footnote}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card data-testid="executive-primary-governance-readiness">
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              {v.costEvidenceStatusMetric.title}
            </CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.costEvidenceStatusMetric.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={EXECUTIVE_KPI_DRILL_THROUGH.costEvidenceFreshness}
              className="block rounded-sm outline-none transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <p className={cn("text-2xl font-semibold tabular-nums", OPERATOR_LINK.nav)}>{costFreshness.display}</p>
            </Link>
            {costFreshness.footnote ? (
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{costFreshness.footnote}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
