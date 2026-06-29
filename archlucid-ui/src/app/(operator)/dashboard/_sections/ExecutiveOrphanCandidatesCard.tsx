"use client";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { KpiTileDrillThroughLink } from "@/components/KpiTileDrillThroughLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
export type ExecutiveOrphanCandidatesCardProps = {
  readonly surface?: "operator" | "executive";
};

export function ExecutiveOrphanCandidatesCard({ surface = "operator" }: ExecutiveOrphanCandidatesCardProps) {
  const executiveSurface = surface === "executive";
  const orphanTitle = executiveSurface ? "Unattached resources" : "Orphan Candidates";
  const orphanDescription = executiveSurface
    ? "Resources flagged for cleanup from the latest committed review"
    : "Server-classified from latest committed review";
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
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {orphanTitle}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {orphanDescription}
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
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {orphanTitle}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {orphanDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
          {orphanTitle}
        </CardTitle>
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
          {orphanDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <KpiTileDrillThroughLink
          href={EXECUTIVE_KPI_DRILL_THROUGH.orphanCandidates}
          testId="kpi-tile-orphan-candidates-link"
        >
          <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
            {data.count}
          </p>
        </KpiTileDrillThroughLink>
        {data.count > 0 ? (
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Estimated savings: {formatUsd(data.savings)}/yr
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
