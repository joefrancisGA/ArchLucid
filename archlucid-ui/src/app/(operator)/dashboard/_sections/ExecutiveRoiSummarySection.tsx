"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ExecutiveRoiSummary = {
  totalEstimatedUsdSavings: number;
  systemCount: number;
  latestRunCount: number;
  systems: Array<{
    systemName: string;
    runId: string;
    committedUtc: string | null;
    estimatedUsdSavings: number | null;
  }>;
  topSystemicIssues: Array<{
    category: string;
    severity: string;
    count: number;
  }>;
};

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Live cross-run executive ROI panel backed by `GET /v1/roi/executive-summary`. */
export function ExecutiveRoiSummarySection() {
  const [data, setData] = useState<ExecutiveRoiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          EXECUTIVE_ROI_SUMMARY_PATH,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as ExecutiveRoiSummary;

        if (!cancelled) {
          setData(json);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load executive ROI summary.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio ROI summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio ROI summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400" data-testid="exec-roi-summary-loading">
            Loading portfolio ROI…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Portfolio ROI summary</CardTitle>
        <CardDescription className="text-xs">
          Latest committed run per system in this workspace. Data from{" "}
          <span className="font-mono">GET /v1/roi/executive-summary</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Estimated USD savings</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatUsd(data.totalEstimatedUsdSavings)}
            </div>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Systems reviewed</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {data.systemCount}
            </div>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Latest runs included</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {data.latestRunCount}
            </div>
          </div>
        </div>

        {data.topSystemicIssues.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Top systemic issues</h3>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
              {data.topSystemicIssues.map((issue) => (
                <li key={`${issue.category}-${issue.severity}`}>
                  <span className="font-medium">{issue.category}</span> · {issue.severity} · {issue.count}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            No committed runs with findings yet — run an architecture review to populate this summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
