"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { tryParseApiProblemDetails } from "@/lib/api-problem";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { AlertCircle, Info } from "lucide-react";

const CROSS_TENANT_PORTFOLIO_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiCrossTenantPortfolio}`;
const PORTFOLIO_CONFIGURATION_DOC_PATH = "docs/library/MULTI_TENANT_PORTFOLIO.md";

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

type PortfolioLoadState =
  | { status: "loading" }
  | { status: "ready"; data: CrossTenantPortfolioSummaryResponse }
  | { status: "configuration-required"; detail: string; title: string | null }
  | { status: "error"; message: string };

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

async function loadPortfolioSummary(): Promise<PortfolioLoadState> {
  try {
    const res = await fetch(
      CROSS_TENANT_PORTFOLIO_SUMMARY_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    const bodyText = await res.text();

    if (res.status === 403) {
      const problem = tryParseApiProblemDetails(bodyText, res.headers.get("content-type"));

      if (problem?.detail) {
        return {
          status: "configuration-required",
          detail: problem.detail,
          title: problem.title ?? null,
        };
      }
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = JSON.parse(bodyText) as CrossTenantPortfolioSummaryResponse;

    return { status: "ready", data: json };
  } catch (e: unknown) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Failed to load cross-tenant portfolio summary.",
    };
  }
}

export function PortfolioPageView() {
  const [state, setState] = useState<PortfolioLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await loadPortfolioSummary();

      if (!cancelled) {
        setState(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Portfolio Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">Loading portfolio data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === "configuration-required") {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Portfolio Dashboard</h1>
        <Card
          className="border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30"
          data-testid="portfolio-directory-key-not-configured"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-5 shrink-0 text-teal-800 dark:text-teal-200" aria-hidden />
              <CardTitle className="text-base text-teal-950 dark:text-teal-100">
                {state.title ?? "Portfolio directory key not configured"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="m-0 text-sm leading-relaxed text-teal-950 dark:text-teal-100">{state.detail}</p>
            <p className="m-0 text-sm">
              <Link
                href={toDocsBlobUrl(PORTFOLIO_CONFIGURATION_DOC_PATH)}
                className="font-medium text-teal-900 underline dark:text-teal-200"
                rel="noopener noreferrer"
                target="_blank"
              >
                Learn more about portfolio configuration
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Portfolio Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="m-0 text-sm font-medium" role="alert">
                {state.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = state.data;

  if (!data.isKAnonymitySatisfied) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Portfolio Dashboard</h1>
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
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Portfolio Dashboard</h1>
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
            <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
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
            <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
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
            <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
              {data.totalCriticalFindings}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.topSystemicIssues.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Top Systemic Issues</CardTitle>
            <CardDescription>Most frequent findings across your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topSystemicIssues.map((issue, index) => (
                <div
                  key={`${issue.category}-${issue.severity}-${index}`}
                  className="flex items-center justify-between border-b border-neutral-100 pb-4 last:border-0 last:pb-0 dark:border-neutral-800"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {issue.category}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Severity: {issue.severity}</p>
                  </div>
                  <div className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {issue.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
