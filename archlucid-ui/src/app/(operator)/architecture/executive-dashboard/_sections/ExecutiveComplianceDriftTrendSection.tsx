"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ComplianceDriftOpenResolvedChart } from "@/components/ComplianceDriftOpenResolvedChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplianceDriftTrend } from "@/lib/api";
import {
  BUYER_EXECUTIVE_COMPLIANCE_DRIFT_TREND_DESCRIPTION,
  BUYER_EXECUTIVE_DATA_SOURCE_NOTE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/** Live compliance drift panel for the executive summary dashboard (`/dashboard`). */
export type ExecutiveComplianceDriftTrendSectionProps = {
  readonly points?: ComplianceDriftTrendPoint[];
  readonly loading?: boolean;
  readonly error?: boolean;
};

/** Live compliance drift panel for the executive summary dashboard (`/dashboard`). */
export function ExecutiveComplianceDriftTrendSection({
  points: pointsProp,
  loading: loadingProp,
  error: errorProp,
}: ExecutiveComplianceDriftTrendSectionProps = {}) {
  const usesExternalData = pointsProp !== undefined || loadingProp !== undefined || errorProp !== undefined;
  const [loading, setLoading] = useState(loadingProp ?? true);
  const [points, setPoints] = useState<ComplianceDriftTrendPoint[]>(pointsProp ?? []);
  const [error, setError] = useState(errorProp ?? false);

  useEffect(() => {
    if (usesExternalData) {
      setPoints(pointsProp ?? []);
      setLoading(loadingProp ?? false);
      setError(errorProp ?? false);

      return undefined;
    }

    let cancelled = false;
    const window = rollingBounds30Days();

    void (async () => {
      try {
        const data = await getComplianceDriftTrend(window.fromUtc, window.toUtc, 1440);

        if (!cancelled) {
          setPoints(data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [errorProp, loadingProp, pointsProp, usesExternalData]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Compliance drift (last 30 days)</CardTitle>
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
          {`${BUYER_EXECUTIVE_COMPLIANCE_DRIFT_TREND_DESCRIPTION} ${BUYER_EXECUTIVE_DATA_SOURCE_NOTE}`}
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
            Open executive workspace health
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
