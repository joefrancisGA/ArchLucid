"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildExecutiveSummaryMarkdown,
  executiveSummaryMarkdownFilename,
  type ExecutiveRoiSummary,
} from "@/lib/executive-summary-markdown";
import { ExecutiveRoiSystemicIssueTrendChart } from "@/components/ExecutiveRoiSystemicIssueTrendChart";
import {
  formatExecutiveRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
import { showError } from "@/lib/toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

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
  const onDownloadExecutiveSummary = useCallback(() => {
    if (data === null) {
      return;
    }

    const markdown = buildExecutiveSummaryMarkdown(data);

    triggerGoldenManifestMarkdownDownload(markdown, executiveSummaryMarkdownFilename());
  }, [data]);

  const onDownloadCsv = useCallback(async () => {
    try {
      const response = await fetch(
        `${EXECUTIVE_ROI_SUMMARY_PATH}/export`,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as {
        rows?: Array<{
          findingId: string;
          runId: string;
          systemName: string;
          environment: string;
          category: string;
          severity: string;
          title: string;
          affectedResource?: string | null;
          estimatedUsdSavings?: number | null;
        }>;
        savingsPricingBasis?: string;
        eaDiscountMultiplier?: number;
        savingsPricingBasisDescription?: string;
        costEvidenceFreshnessStatus?: string;
      };

      const eaMultiplier = json.eaDiscountMultiplier ?? 1;
      const preamble = [
        `# Savings pricing basis: ${json.savingsPricingBasis ?? "Retail"} (EA discount multiplier ${eaMultiplier})`,
        json.savingsPricingBasisDescription ? `# ${json.savingsPricingBasisDescription}` : null,
        json.costEvidenceFreshnessStatus ? `# Cost evidence freshness: ${json.costEvidenceFreshnessStatus}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const header = "FindingId,RunId,SystemName,Environment,Category,Severity,Title,AffectedResource,EstimatedUsdSavings";
      const lines = (json.rows ?? []).map((row) =>
        [
          row.findingId,
          row.runId,
          row.systemName,
          row.environment,
          row.category,
          row.severity,
          `"${row.title.replaceAll('"', '""')}"`,
          row.affectedResource ?? "",
          row.estimatedUsdSavings ?? "",
        ].join(","),
      );

      const blob = new Blob([[preamble, header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "executive-roi-findings.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      showError("CSV export failed", e instanceof Error ? e.message : String(e));
    }
  }, []);

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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">Portfolio ROI summary</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void onDownloadCsv()}
            data-testid="exec-roi-summary-csv-download-button"
          >
            Export findings (CSV)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDownloadExecutiveSummary}
            data-testid="exec-roi-summary-markdown-download-button"
          >
            Download executive summary (Markdown)
          </Button>
        </div>
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
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400" data-testid="exec-roi-pricing-basis">
              {formatExecutiveRoiPricingBasisLabel(data.savingsPricingBasis, data.eaDiscountMultiplier)}
            </div>
            {data.savingsPricingBasisDescription ? (
              <p
                className="mt-2 text-xs text-neutral-600 dark:text-neutral-400"
                data-testid="exec-roi-pricing-basis-description"
              >
                {data.savingsPricingBasisDescription}
              </p>
            ) : null}
          </div>
          {data.basisBreakdown ? (
            <div className="rounded-md border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/30">
              <div className="text-xs font-medium text-teal-800 dark:text-teal-200">Realized USD (remediated)</div>
              <div
                className="mt-1 text-lg font-semibold tabular-nums text-teal-950 dark:text-teal-50"
                data-testid="exec-roi-realized-usd"
              >
                {formatUsd(data.basisBreakdown.realizedUsd)}
              </div>
              <p className="mt-1 text-xs text-teal-900 dark:text-teal-100">
                Open estimated ${data.basisBreakdown.openEstimatedUsd.toFixed(0)} · Deferred/waived $
                {(data.basisBreakdown.deferredUsd + data.basisBreakdown.waivedUsd).toFixed(0)}
              </p>
            </div>
          ) : null}
          {shouldShowRoiCostEvidenceFreshnessWarning(data.costEvidenceFreshnessStatus) ? (
            <div
              className="sm:col-span-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              role="alert"
              data-testid="exec-roi-cost-evidence-freshness-warning"
            >
              {formatRoiCostEvidenceFreshnessWarning(
                data.costEvidenceFreshnessStatus,
                data.costEvidenceStaleAfterDays,
                data.latestCostEvidenceCollectionTimestampUtc ?? null,
              )}
            </div>
          ) : null}
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

        {(data.historicalTrends?.length ?? 0) > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Systemic issue trends (last 6 months)
            </h3>
            <div className="mt-3">
              <ExecutiveRoiSystemicIssueTrendChart
                series={data.historicalTrends ?? []}
                savingsPricingBasis={data.savingsPricingBasis}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
