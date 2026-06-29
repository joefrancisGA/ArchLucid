"use client";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  fetchTrialFunnelOperationalSummary,
  type TrialFunnelOperationalSummary,
} from "@/lib/trial-funnel-ops";

function formatHoursFromSeconds(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return "—";
  }

  return `${(seconds / 3600).toFixed(1)} h`;
}

export function TrialFunnelOpsPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [data, setData] = useState<TrialFunnelOperationalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchTrialFunnelOperationalSummary();
      setData(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load trial funnel summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

  if (isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="trial-funnel-ops-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Trial-to-paid funnel</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Trailing 30-day signup, first commit, conversion, and estimated first-review LLM COGS bands. Sales-led checkout
          remains deferred — no live Stripe claims here.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Active trials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue)}>{data?.activeSelfServiceTrials ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>First commits (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue)}>{data?.firstCommittedReviews30Days ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Conversions (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue)}>{data?.trialConversions30Days ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Median signup → first commit</CardTitle>
        </CardHeader>
        <CardContent className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {formatHoursFromSeconds(data?.medianSignupToFirstCommitSeconds ?? null)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Estimated first-review LLM COGS band</CardTitle>
        </CardHeader>
        <CardContent className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {data?.estimatedFirstReviewCogsUsdMid != null ? (
            <p className="m-0">
              Low ${data.estimatedFirstReviewCogsUsdLow?.toFixed(2) ?? "—"} · Mid $
              {data.estimatedFirstReviewCogsUsdMid.toFixed(2)} · High $
              {data.estimatedFirstReviewCogsUsdHigh?.toFixed(2) ?? "—"} ({data.cogsBasisLabel})
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No COGS samples yet for recent first commits.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
