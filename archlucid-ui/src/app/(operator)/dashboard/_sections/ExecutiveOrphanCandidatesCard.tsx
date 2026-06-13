"use client";

import { useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { KpiTileDrillThroughLink } from "@/components/KpiTileDrillThroughLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Server-authoritative orphan KPI tile (TB-103). */
export function ExecutiveOrphanCandidatesCard() {
  const [data, setData] = useState<{ count: number; savings: number | null } | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const json = await fetchExecutiveRoiSummaryClient();

        if (cancelled) {
          return;
        }

        const orphans = json.orphanCandidates;

        setData({
          count: orphans?.candidateCount ?? 0,
          savings: orphans?.annualSavingsUsd ?? null,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setFailure(toApiLoadFailure(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (failure) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Orphan Candidates
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Server-classified from latest committed review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OperatorApiProblem failure={failure} />
        </CardContent>
      </Card>
    );
  }

  if (data === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Orphan Candidates
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Server-classified from latest committed review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-neutral-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Orphan Candidates
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
          Server-classified from latest committed review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <KpiTileDrillThroughLink
          href={EXECUTIVE_KPI_DRILL_THROUGH.orphanCandidates}
          testId="kpi-tile-orphan-candidates-link"
        >
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {data.count}
          </p>
        </KpiTileDrillThroughLink>
        {data.count > 0 ? (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Estimated savings: {formatUsd(data.savings)}/yr
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
