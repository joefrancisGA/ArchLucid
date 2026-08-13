"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ComplianceDriftOpenResolvedChart } from "@/components/ComplianceDriftOpenResolvedChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import {
  BUYER_SPONSOR_COMPLIANCE_DRIFT_TREND_DESCRIPTION,
  BUYER_SPONSOR_DATA_SOURCE_NOTE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

/** Live compliance drift panel for the sponsor report dashboard (`/dashboard`). */
export type SponsorComplianceDriftTrendSectionProps = {
  readonly points?: ComplianceDriftTrendPoint[];
  readonly loading?: boolean;
  readonly error?: boolean;
};

/** Live compliance drift panel for the sponsor report dashboard (`/dashboard`). */
export function SponsorComplianceDriftTrendSection({
  points: pointsProp,
  loading: loadingProp,
  error: errorProp,
}: SponsorComplianceDriftTrendSectionProps = {}) {
  const usesExternalData = pointsProp !== undefined || loadingProp !== undefined || errorProp !== undefined;
  const driftQuery = useComplianceDriftTrendQuery({ enabled: !usesExternalData });

  const loading = usesExternalData
    ? (loadingProp ?? false)
    : driftQuery.isPending || (driftQuery.isFetching && !driftQuery.isFetched);
  const points = usesExternalData ? (pointsProp ?? []) : (driftQuery.data ?? []);
  const error = usesExternalData ? (errorProp ?? false) : driftQuery.isError;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Compliance drift (last 30 days)</CardTitle>
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
          {`${BUYER_SPONSOR_COMPLIANCE_DRIFT_TREND_DESCRIPTION} ${BUYER_SPONSOR_DATA_SOURCE_NOTE}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="exec-compliance-drift-loading">
            Loading compliance drift…
          </p>
        ) : null}
        {!loading && error ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
            Compliance drift trend is unavailable right now.
          </p>
        ) : null}
        {!loading && !error ? (
          points.length === 0 ? (
            <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
              <p className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Data gathering in progress. Commit a review to see trends.
              </p>
            </div>
          ) : (
            <ComplianceDriftOpenResolvedChart points={points} />
          )
        ) : null}
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link href={GOVERNANCE_WORKSPACE_HEALTH_HREF} className={OPERATOR_LINK.inline}>
            Open sponsor workspace health
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
