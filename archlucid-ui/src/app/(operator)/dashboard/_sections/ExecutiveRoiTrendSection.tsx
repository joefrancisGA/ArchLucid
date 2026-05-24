"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type HistoryPoint = {
  snapshotUtc: string;
  totalEstimatedUsdSavings: number;
  criticalSecurityFindings: number;
};

function formatMonth(isoUtc: string): string {
  const date = new Date(isoUtc);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

/** Six-month executive ROI savings and critical-finding trend chart. */
export function ExecutiveRoiTrendSection() {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/proxy/${ApiV1Routes.roiExecutiveSummary}/history`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as { points?: HistoryPoint[] };

        if (!cancelled) {
          setPoints(json.points ?? []);
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
  }, []);

  const maxSavings = Math.max(...points.map((point) => point.totalEstimatedUsdSavings), 1);
  const maxCritical = Math.max(...points.map((point) => point.criticalSecurityFindings), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">ROI trend (last 6 months)</CardTitle>
        <CardDescription className="text-xs">
          Estimated USD savings and critical security findings over time from{" "}
          <span className="font-mono">GET /v1/roi/executive-summary/history</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">Loading ROI trend…</p>
        ) : null}
        {!loading && error ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" role="alert">
            ROI trend is unavailable right now.
          </p>
        ) : null}
        {!loading && !error && points.length === 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Commit architecture reviews to populate longitudinal ROI trends.
          </p>
        ) : null}
        {!loading && !error && points.length > 0 ? (
          <div className="space-y-4" data-testid="exec-roi-trend-chart">
            <div>
              <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">Estimated USD savings</div>
              <div className="flex items-end gap-2">
                {points.map((point) => (
                  <div key={`savings-${point.snapshotUtc}`} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-emerald-500/80"
                      style={{ height: `${Math.max(8, Math.round((point.totalEstimatedUsdSavings / maxSavings) * 120))}px` }}
                      title={`$${Math.round(point.totalEstimatedUsdSavings).toLocaleString()}`}
                    />
                    <span className="text-[10px] text-neutral-500">{formatMonth(point.snapshotUtc)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">Critical security findings</div>
              <div className="flex items-end gap-2">
                {points.map((point) => (
                  <div key={`critical-${point.snapshotUtc}`} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-amber-500/80"
                      style={{ height: `${Math.max(8, Math.round((point.criticalSecurityFindings / maxCritical) * 120))}px` }}
                      title={`${point.criticalSecurityFindings} critical findings`}
                    />
                    <span className="text-[10px] text-neutral-500">{formatMonth(point.snapshotUtc)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
