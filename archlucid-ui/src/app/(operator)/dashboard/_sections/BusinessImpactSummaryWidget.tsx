"use client";

import React, { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatExecutiveRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";
import { Activity, DollarSign, ShieldAlert } from "lucide-react";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;

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
function readBusinessImpactCounts(data: ExecutiveRoiSummary | null): {
  securityCompliance: number;
  reliability: number;
} {
  const counts = data?.businessImpactCategoryCounts;

  return {
    securityCompliance: counts?.securityComplianceThemeCount ?? 0,
    reliability: counts?.reliabilityThemeCount ?? 0,
  };
}

/** Live business-impact tiles from `GET /v1/roi/executive-summary` (TB-062 / Batch C item 7). */
export function BusinessImpactSummaryWidget() {
  const [data, setData] = useState<ExecutiveRoiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const response = await fetch(
          EXECUTIVE_ROI_SUMMARY_PATH,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as ExecutiveRoiSummary;

        if (mounted) {
          setData(json);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load business impact summary.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 p-4" role="alert">
        Business impact summary unavailable: {error}
      </div>
    );
  }

  const hasCommittedRuns = (data?.systemCount ?? 0) > 0;
  const businessImpactCounts = readBusinessImpactCounts(data);
  const securityComplianceCount = businessImpactCounts.securityCompliance;
  const reliabilityCount = businessImpactCounts.reliability;

  return (
    <section aria-labelledby="business-impact-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="business-impact-heading" className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Business impact summary
        </h2>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Live signals from committed reviews via{" "}
          <span className="font-mono text-xs">GET /v1/roi/executive-summary</span>.
          {!hasCommittedRuns && !isLoading ? " Commit a review to populate these cards." : null}
        </p>
      </div>

      {shouldShowRoiCostEvidenceFreshnessWarning(data?.costEvidenceFreshnessStatus) ? (
        <p
          className="m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-xs text-al-text-primary dark:border-amber-700/50"
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Estimated savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <>
                <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {formatUsd(data?.totalEstimatedUsdSavings)}
                </p>
                {data ? (
                  <CardDescription className="mt-2 text-xs">
                    {formatExecutiveRoiPricingBasisLabel(data.savingsPricingBasis, data.eaDiscountMultiplier)}
                  </CardDescription>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Security / compliance themes
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {hasCommittedRuns ? securityComplianceCount : "—"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Reliability themes
            </CardTitle>
            <Activity className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {hasCommittedRuns ? reliabilityCount : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
