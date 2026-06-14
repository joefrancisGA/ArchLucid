"use client";

import { useCallback, useEffect, useState } from "react";

import { downloadExecutiveRoiBoardPack } from "@/lib/api/executive-roi-board-pack-api";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
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
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import { BUYER_EXECUTIVE_DATA_SOURCE_NOTE } from "@/lib/buyer-polish-copy";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveExecutiveHeadlineScopeLabel,
  resolveExecutiveSystemRowScopeLabel,
} from "@/lib/roi-sponsor-scope-labels";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;

function executiveRoiSummaryCardTitle(): string {
  if (isBuyerPolishedOperatorShellEnv()) {
    return BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle;
  }

  return "Portfolio ROI summary";
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

export type ExecutiveRoiSummarySectionProps = {
  readonly summary?: ExecutiveRoiSummary | null;
  readonly loading?: boolean;
  readonly summaryError?: string | null;
};

/** Live cross-run executive ROI panel backed by `GET /v1/roi/executive-summary`. */
export function ExecutiveRoiSummarySection({
  summary: summaryProp,
  loading: loadingProp,
  summaryError: summaryErrorProp,
}: ExecutiveRoiSummarySectionProps = {}) {
  const [data, setData] = useState<ExecutiveRoiSummary | null>(summaryProp ?? null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const usesExternalSummary = summaryProp !== undefined || loadingProp !== undefined || summaryErrorProp !== undefined;
  const [boardPackBusy, setBoardPackBusy] = useState(false);
  const [includeBoardPackNarrative, setIncludeBoardPackNarrative] = useState(false);
  const onDownloadExecutiveSummary = useCallback(() => {
    const resolved = usesExternalSummary ? summaryProp : data;

    if (resolved === null || resolved === undefined) {
      return;
    }

    const markdown = buildExecutiveSummaryMarkdown(resolved);

    triggerGoldenManifestMarkdownDownload(markdown, executiveSummaryMarkdownFilename());
  }, [data, summaryProp, usesExternalSummary]);

  const onDownloadBoardPack = useCallback(async () => {
    setBoardPackBusy(true);

    try {
      await downloadExecutiveRoiBoardPack({
        format: "md",
        generateNarrative: includeBoardPackNarrative,
      });
    } catch (e: unknown) {
      showError("Board pack download failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBoardPackBusy(false);
    }
  }, [includeBoardPackNarrative]);

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
    if (usesExternalSummary) {
      setData(summaryProp ?? null);
      setFailure(null);

      return undefined;
    }

    let cancelled = false;

    void (async () => {
      try {
        const json = await fetchExecutiveRoiSummaryClient();

        if (!cancelled) {
          setData(json);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setFailure(toApiLoadFailure(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [summaryProp, usesExternalSummary]);

  if (usesExternalSummary && summaryErrorProp) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{executiveRoiSummaryCardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" role="alert">
            {summaryErrorProp}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (failure) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{executiveRoiSummaryCardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatorApiProblem failure={failure} />
        </CardContent>
      </Card>
    );
  }

  const displayData = usesExternalSummary ? (summaryProp ?? null) : data;
  const showLoading = usesExternalSummary ? (loadingProp ?? false) : displayData === null;

  if (showLoading || displayData === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{executiveRoiSummaryCardTitle()}</CardTitle>
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
          <CardTitle className="text-base">{executiveRoiSummaryCardTitle()}</CardTitle>
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={boardPackBusy}
            onClick={() => void onDownloadBoardPack()}
            data-testid="exec-roi-board-pack-download-button"
          >
            {boardPackBusy ? "Board pack…" : "Download board pack (Markdown)"}
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={includeBoardPackNarrative}
            onChange={(e) => setIncludeBoardPackNarrative(e.target.checked)}
            data-testid="exec-roi-board-pack-narrative-toggle"
          />
          {isBuyerPolishedOperatorShellEnv()
            ? "Include an AI-generated executive summary."
            : "Include AI executive summary (uses 1 fast LLM call when enabled in API config)"}
        </label>
        <CardDescription className="text-xs">
          {isBuyerPolishedOperatorShellEnv() ? (
            <>Latest committed review per system in this workspace. {BUYER_EXECUTIVE_DATA_SOURCE_NOTE}</>
          ) : (
            <>
              {resolveExecutiveHeadlineScopeLabel(displayData)} {resolveExecutiveSystemRowScopeLabel(displayData)} Data from{" "}
              <span className="font-mono">GET /v1/roi/executive-summary</span>.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Estimated USD savings (headline)</div>
            <p
              className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400"
              data-testid="exec-roi-headline-scope-description"
            >
              {resolveExecutiveHeadlineScopeLabel(data)}
            </p>
            <div className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}>
              {formatUsd(displayData.totalEstimatedUsdSavings)}
            </div>
            <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400" data-testid="exec-roi-pricing-basis">
              {formatExecutiveRoiPricingBasisLabel(displayData.savingsPricingBasis, displayData.eaDiscountMultiplier)}
            </div>
            {displayData.savingsPricingBasisDescription ? (
              <p
                className="mt-2 text-xs text-neutral-600 dark:text-neutral-400"
                data-testid="exec-roi-pricing-basis-description"
              >
                {displayData.savingsPricingBasisDescription}
              </p>
            ) : null}
          </div>
          {displayData.basisBreakdown ? (
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-3">
              <div className="text-xs font-medium text-teal-800 dark:text-teal-200">Realized USD (remediated)</div>
              <div
                className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}
                data-testid="exec-roi-realized-usd"
              >
                {formatUsd(displayData.basisBreakdown.realizedUsd)}
              </div>
              <p className="mt-1 text-xs text-teal-900 dark:text-teal-100">
                Open estimated ${displayData.basisBreakdown.openEstimatedUsd.toFixed(0)} · Deferred/waived $
                {(displayData.basisBreakdown.deferredUsd + displayData.basisBreakdown.waivedUsd).toFixed(0)}
              </p>
            </div>
          ) : null}
          {shouldShowRoiCostEvidenceFreshnessWarning(displayData.costEvidenceFreshnessStatus) ? (
            <div
              className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 sm:col-span-3 px-3 py-2 text-xs"
              role="alert"
              data-testid="exec-roi-cost-evidence-freshness-warning"
            >
              {formatRoiCostEvidenceFreshnessWarning(
                displayData.costEvidenceFreshnessStatus,
                displayData.costEvidenceStaleAfterDays,
                displayData.latestCostEvidenceCollectionTimestampUtc ?? null,
              )}
            </div>
          ) : null}
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Systems reviewed</div>
            <div className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}>
              {displayData.systemCount}
            </div>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Latest reviews included</div>
            <div className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}>
              {displayData.latestRunCount}
            </div>
          </div>
        </div>

        {displayData.topSystemicIssues.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Top systemic issues</h3>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
              {displayData.topSystemicIssues.map((issue) => (
                <li key={`${issue.category}-${issue.severity}`}>
                  <span className="font-medium">{issue.category}</span> · {issue.severity} · {issue.count}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            No committed reviews with findings yet — run an architecture review to populate this summary.
          </p>
        )}

        {(displayData.historicalTrends?.length ?? 0) > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Systemic issue trends (last 6 months)
            </h3>
            <div className="mt-3">
              <ExecutiveRoiSystemicIssueTrendChart
                series={displayData.historicalTrends ?? []}
                savingsPricingBasis={displayData.savingsPricingBasis}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
