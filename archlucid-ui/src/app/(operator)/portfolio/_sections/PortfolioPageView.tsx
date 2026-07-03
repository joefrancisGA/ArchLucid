"use client";

import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { tryParseApiProblemDetails } from "@/lib/api-problem";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_KPI_CARD_TITLE, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";
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

type TenantBaselineResponse = {
  baselineReviewCycleHours?: unknown;
  manualPrepHoursPerReview?: unknown;
};

type RoiBaselineStatus = "configured" | "not-configured" | "unknown";

type PortfolioLoadState =
  | { status: "loading"; roiBaselineStatus: RoiBaselineStatus }
  | { status: "ready"; data: CrossTenantPortfolioSummaryResponse; roiBaselineStatus: RoiBaselineStatus }
  | { status: "configuration-required"; detail: string; title: string | null; roiBaselineStatus: RoiBaselineStatus }
  | { status: "error"; message: string; roiBaselineStatus: RoiBaselineStatus };

async function loadRoiBaselineStatus(): Promise<RoiBaselineStatus> {
  try {
    const baselineRes = await fetch(
      "/api/proxy/v1/tenant/baseline",
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!baselineRes.ok) {
      return "unknown";
    }

    const baselineBodyText = await baselineRes.text();
    const baselineData = JSON.parse(baselineBodyText) as TenantBaselineResponse;

    return isPilotRoiBaselineComplete({
      baselineReviewCycleHours: baselineData.baselineReviewCycleHours,
      manualPrepHoursPerReview: baselineData.manualPrepHoursPerReview,
    })
      ? "configured"
      : "not-configured";
  } catch {
    return "unknown";
  }
}

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
  const roiBaselineStatus = await loadRoiBaselineStatus();

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
          roiBaselineStatus,
        };
      }
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = JSON.parse(bodyText) as CrossTenantPortfolioSummaryResponse;

    return { status: "ready", data: json, roiBaselineStatus };
  } catch (e: unknown) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Failed to load cross-tenant portfolio summary.",
      roiBaselineStatus,
    };
  }
}

function PortfolioRoiBaselineSetupCard(): React.JSX.Element {
  return (
    <Card data-testid="portfolio-roi-baseline-setup-card">
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>ROI baseline not configured</CardTitle>
        <CardDescription>
          Add baseline assumptions to calculate estimated savings and sponsor ROI.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild variant="primary" size="sm">
          <Link href="/settings/baseline">Configure ROI baseline</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function PortfolioPageView() {
  const [state, setState] = useState<PortfolioLoadState>({ status: "loading", roiBaselineStatus: "unknown" });

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
      <OperatorPageContainer variant="dashboard" className="space-y-8">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.portfolioOverview}</h1>
        <Card>
          <CardContent className="pt-6">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading portfolio data...</p>
          </CardContent>
        </Card>
      </OperatorPageContainer>
    );
  }

  if (state.status === "configuration-required") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-8">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.portfolioOverview}</h1>
        <Card
          className="border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30"
          data-testid="portfolio-directory-key-not-configured"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-5 shrink-0 text-teal-800 dark:text-teal-200" aria-hidden />
              <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-teal-950 dark:text-teal-100")}>
                {state.title ?? "Portfolio directory key not configured"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body, "leading-relaxed text-teal-950 dark:text-teal-100")}>{state.detail}</p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link
                href={toDocsBlobUrl(PORTFOLIO_CONFIGURATION_DOC_PATH)}
                className={OPERATOR_LINK.inline}
                rel="noopener noreferrer"
                target="_blank"
              >
                Learn more about portfolio configuration
              </Link>
            </p>
          </CardContent>
        </Card>
        {state.roiBaselineStatus === "not-configured" ? <PortfolioRoiBaselineSetupCard /> : null}
      </OperatorPageContainer>
    );
  }

  if (state.status === "error") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-8">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.portfolioOverview}</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body, "font-medium")} role="alert">
                {state.message}
              </p>
            </div>
          </CardContent>
        </Card>
        {state.roiBaselineStatus === "not-configured" ? <PortfolioRoiBaselineSetupCard /> : null}
      </OperatorPageContainer>
    );
  }

  const data = state.data;

  if (!data.isKAnonymitySatisfied) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-8">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.portfolioOverview}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Insufficient Data</CardTitle>
            <CardDescription>
              Cross-tenant portfolio metrics require access to at least 5 active tenants to preserve k-anonymity and data privacy.
            </CardDescription>
          </CardHeader>
        </Card>
        {state.roiBaselineStatus === "not-configured" ? <PortfolioRoiBaselineSetupCard /> : null}
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{BUYER_TERMINOLOGY.portfolioOverview}</h1>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Aggregated ROI and risk metrics across all your accessible tenants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Total Estimated Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
              {formatUsd(data.totalEstimatedUsdSavings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Systems Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
              {data.totalSystemCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
              Critical Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={OPERATOR_TYPOGRAPHY.kpiValue}>
              {data.totalCriticalFindings}
            </p>
          </CardContent>
        </Card>
      </div>

      {state.roiBaselineStatus === "not-configured" ? <PortfolioRoiBaselineSetupCard /> : null}

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
                    <p className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "leading-none")}>
                      {issue.category}
                    </p>
                    <p className={OPERATOR_TYPOGRAPHY.helper}>Severity: {issue.severity}</p>
                  </div>
                  <div className={cn(OPERATOR_TYPOGRAPHY.dataValue, "font-mono")}>
                    {issue.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </OperatorPageContainer>
  );
}
