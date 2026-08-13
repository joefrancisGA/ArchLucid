"use client";

import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

import { useExecutiveRoiSummaryQuery } from "@/hooks/use-executive-roi-summary-query";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import {
  formatExecutiveRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { Activity, DollarSign, Landmark, Scale, ShieldAlert, Workflow } from "lucide-react";

function formatUsd(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Server-authoritative business-impact theme counts (TB-105). */
function readBusinessImpactCounts(data: ExecutiveRoiSummary | null) {
  const counts = data?.businessImpactCategoryCounts;

  return {
    security: counts?.securityThemeCount ?? 0,
    compliance: counts?.complianceThemeCount ?? 0,
    securityCompliance: counts?.securityComplianceThemeCount ?? 0,
    reliability: counts?.reliabilityThemeCount ?? 0,
    cost: counts?.costThemeCount ?? 0,
    governance: counts?.governanceThemeCount ?? 0,
    other: counts?.otherThemeCount ?? 0,
  };
}

export type BusinessImpactSummaryWidgetProps = {
  readonly summary?: ExecutiveRoiSummary | null;
  readonly loading?: boolean;
  readonly surface?: "operator" | "executive";
};

/** Live business-impact tiles from executive ROI summary (TB-062 / Batch C item 7). */
export function BusinessImpactSummaryWidget({
  summary: summaryProp,
  loading: loadingProp,
  surface = "operator",
}: BusinessImpactSummaryWidgetProps = {}) {
  const executiveSurface = surface === "executive";
  const usesExternalSummary = summaryProp !== undefined || loadingProp !== undefined;
  const summaryQuery = useExecutiveRoiSummaryQuery({ enabled: !usesExternalSummary });
  const data = usesExternalSummary ? (summaryProp ?? null) : (summaryQuery.data ?? null);
  const isLoading = usesExternalSummary ? (loadingProp ?? false) : summaryQuery.isPending && data === null;
  const failure = useMemo(
    () => (usesExternalSummary || !summaryQuery.isError ? null : toApiLoadFailure(summaryQuery.error)),
    [summaryQuery.error, summaryQuery.isError, usesExternalSummary],
  );

  if (failure) {
    return <OperatorApiProblem failure={failure} />;
  }

  const hasCommittedRuns = (data?.systemCount ?? 0) > 0;
  const businessImpactCounts = readBusinessImpactCounts(data);
  const themeCards = [
    { key: "security", label: "Security themes", value: businessImpactCounts.security, icon: ShieldAlert },
    { key: "compliance", label: "Compliance themes", value: businessImpactCounts.compliance, icon: Scale },
    { key: "reliability", label: "Reliability themes", value: businessImpactCounts.reliability, icon: Activity },
    { key: "cost", label: "Cost themes", value: businessImpactCounts.cost, icon: DollarSign },
    { key: "governance", label: "Governance themes", value: businessImpactCounts.governance, icon: Landmark },
    { key: "other", label: "Other themes", value: businessImpactCounts.other, icon: Workflow },
  ] as const;

  return (
    <section aria-labelledby="business-impact-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="business-impact-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          Business impact summary
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Theme counts from finalized reviews in this workspace.
          {!hasCommittedRuns && !isLoading ? " Finalize a review to populate these cards." : null}
        </p>
      </div>

      {shouldShowRoiCostEvidenceFreshnessWarning(data?.costEvidenceFreshnessStatus) ? (
        <p
          className={cn("m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.helper)}
          role="alert"
          data-testid="business-impact-cost-evidence-warning"
        >
          {formatRoiCostEvidenceFreshnessWarning(
            data?.costEvidenceFreshnessStatus,
            data?.costEvidenceStaleAfterDays,
            data?.latestCostEvidenceCollectionTimestampUtc ?? null,
          )}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!executiveSurface ? (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Estimated savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <>
                <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
                  {formatUsd(data?.totalEstimatedUsdSavings)}
                </p>
                {data ? (
                  <CardDescription className={cn("mt-2", OPERATOR_KPI_CARD_DESCRIPTION)}>
                    {formatExecutiveRoiPricingBasisLabel(data.savingsPricingBasis, data.eaDiscountMultiplier)}
                  </CardDescription>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
        ) : null}

        {themeCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-neutral-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                ) : (
                  <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
                    {hasCommittedRuns ? card.value : "—"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
