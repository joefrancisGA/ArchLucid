"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
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
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="text-sm text-rose-800 dark:text-rose-200" role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="trial-funnel-ops-page">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Trial-to-paid funnel</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Trailing 30-day signup, first commit, conversion, and estimated first-review LLM COGS bands. Sales-led checkout
          remains deferred — no live Stripe claims here.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active trials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold">{data?.activeSelfServiceTrials ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First commits (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold">{data?.firstCommittedReviews30Days ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold">{data?.trialConversions30Days ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Median signup → first commit</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
          {formatHoursFromSeconds(data?.medianSignupToFirstCommitSeconds ?? null)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Estimated first-review LLM COGS band</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
          {data?.estimatedFirstReviewCogsUsdMid != null ? (
            <p className="m-0">
              Low ${data.estimatedFirstReviewCogsUsdLow?.toFixed(2) ?? "—"} · Mid $
              {data.estimatedFirstReviewCogsUsdMid.toFixed(2)} · High $
              {data.estimatedFirstReviewCogsUsdHigh?.toFixed(2) ?? "—"} ({data.cogsBasisLabel})
            </p>
          ) : (
            <p className="m-0 text-neutral-500">No COGS samples yet for recent first commits.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
