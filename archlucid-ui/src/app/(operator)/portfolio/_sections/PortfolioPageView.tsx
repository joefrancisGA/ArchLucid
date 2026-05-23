"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { AlertCircle } from "lucide-react";

const CROSS_TENANT_PORTFOLIO_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiCrossTenantPortfolio}`;

export type SystemicIssueSummary = {
  category: string;
  severity: string;
  count: number;
};

export type CrossTenantPortfolioSummaryResponse = {
  totalEstimatedUsdSavings: number;
  totalSystemCount: number;
  totalCriticalFindings: number;
  topSystemicIssues: SystemicIssueSummary[];
  isKAnonymitySatisfied: boolean;
};

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

export function PortfolioPageView() {
  const [data, setData] = useState<CrossTenantPortfolioSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          CROSS_TENANT_PORTFOLIO_SUMMARY_PATH,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as CrossTenantPortfolioSummaryResponse;

        if (!cancelled) {
          setData(json);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load cross-tenant portfolio summary.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Portfolio Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="m-0 text-sm font-medium" role="alert">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Portfolio Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">Loading portfolio data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data.isKAnonymitySatisfied) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Portfolio Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Insufficient Data</CardTitle>
            <CardDescription>
              Cross-tenant portfolio metrics require access to at least 5 active tenants to preserve k-anonymity and data privacy.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Portfolio Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Aggregated ROI and risk metrics across all your accessible tenants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total Estimated Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
              {formatUsd(data.totalEstimatedUsdSavings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Systems Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
              {data.totalSystemCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Critical Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
              {data.totalCriticalFindings}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.topSystemicIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Systemic Issues</CardTitle>
            <CardDescription>Most frequent findings across your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topSystemicIssues.map((issue, i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0 last:pb-0 dark:border-neutral-800">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {issue.category}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Severity: {issue.severity}
                    </p>
                  </div>
                  <div className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {issue.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
