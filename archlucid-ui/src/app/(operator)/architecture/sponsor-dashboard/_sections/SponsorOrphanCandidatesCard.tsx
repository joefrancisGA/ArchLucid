"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { KpiTileDrillThroughLink } from "@/components/KpiTileDrillThroughLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor-kpi-drill-through-hrefs";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
export type SponsorOrphanCandidatesCardProps = {
  readonly surface?: "operator" | "sponsor";
};

export function SponsorOrphanCandidatesCard({ surface = "operator" }: SponsorOrphanCandidatesCardProps) {
  const executiveSurface = surface === "sponsor";
  const orphanTitle = executiveSurface ? "Unattached resources" : "Orphan Candidates";
  const orphanDescription = executiveSurface
    ? "Resources flagged for cleanup from the latest committed review"
    : "Server-classified from latest committed review";
  const summaryQuery = useSponsorRoiSummaryQuery();
  const data = useMemo(() => {
    if (summaryQuery.data === undefined) {
      return null;
    }

    const orphans = summaryQuery.data.orphanCandidates;

    return {
      count: orphans?.candidateCount ?? 0,
      savings: orphans?.annualSavingsUsd ?? null,
    };
  }, [summaryQuery.data]);
  const failure = summaryQuery.isError ? toApiLoadFailure(summaryQuery.error) : null;

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
          href={SPONSOR_KPI_DRILL_THROUGH.orphanCandidates}
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
