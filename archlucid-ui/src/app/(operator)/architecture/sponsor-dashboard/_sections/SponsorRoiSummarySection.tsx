"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";
import { useAskRunCoverageHonestyQuery } from "@/hooks/use-ask-run-coverage-honesty-query";

import { downloadSponsorRoiBoardPack } from "@/lib/api/sponsor-roi-board-pack-api";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { DemoTenantSeedCallout } from "@/components/DemoTenantSeedCallout";
import { Button } from "@/components/ui/button";
import {
  buildSponsorSummaryMarkdown,
  SponsorReportMarkdownFilename,
  type SponsorRoiSummary,
} from "@/lib/sponsor-report-markdown";
import { SponsorRoiIdentifiedVsRealizedPanel } from "./SponsorRoiIdentifiedVsRealizedPanel";
import { SponsorRoiBoardPackEvidenceBanner } from "./SponsorRoiBoardPackEvidenceBanner";
import { SponsorRoiProofStatusStrip } from "./SponsorRoiProofStatusStrip";
import { SponsorRoiSystemsIncludedSection } from "./SponsorRoiSystemsIncludedSection";
import { RoiHeadlineMathTooltip } from "@/components/roi/RoiHeadlineMathTooltip";
import { resolveSponsorRoiIdentifiedVsRealized } from "@/lib/sponsor-roi-identified-vs-realized";
import {
  manifestSummarySealedVersionForCopyGuard,
  runCollateralSealedManifestCopyBlockedReason,
} from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
import { formatSponsorReviewCoverageHonestyMarkdown } from "@/lib/sponsor/sponsor-review-coverage-honesty";
import { showError } from "@/lib/toast";
import { verifyBoardPackRunLineage } from "@/lib/exports/traceability-bundle-download";
import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { BUYER_SPONSOR_DATA_SOURCE_NOTE } from "@/lib/buyer/buyer-polish-copy";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveSponsorHeadlineScopeLabel,
  resolveSponsorSystemRowScopeLabel,
} from "@/lib/roi-sponsor-scope-labels";
import {
  buildSponsorServerSavingsSummary,
  resolveRunSavingsUsd,
} from "@/lib/roi-resolution-priority";

import { SponsorRoiSystemicIssueTrendChartDeferred } from "./sponsor-roi-dashboard-deferred-chunks";

const SPONSOR_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiSponsorReport}`;

function sponsorRoiSummaryCardTitle(): string {
  if (isBuyerPolishedOperatorShellEnv()) {
    return BUYER_SPONSOR_SUMMARY_VOCABULARY.pageTitle;
  }

  return "Portfolio ROI summary";
}

export type SponsorRoiSummarySectionProps = {
  readonly summary?: SponsorRoiSummary | null;
  readonly loading?: boolean;
  readonly summaryError?: string | null;
  readonly surface?: "operator" | "sponsor";
  readonly scopedReviewId?: string;
};

/** Live cross-run sponsor ROI panel backed by sponsor ROI summary API. */
export function SponsorRoiSummarySection({
  summary: summaryProp,
  loading: loadingProp,
  summaryError: summaryErrorProp,
  surface = "operator",
  scopedReviewId = "",
}: SponsorRoiSummarySectionProps = {}) {
  const executiveSurface = surface === "sponsor";
  const workingDesk = useProductionDeskChrome();
  const usesExternalSummary = summaryProp !== undefined || loadingProp !== undefined || summaryErrorProp !== undefined;
  const summaryQuery = useSponsorRoiSummaryQuery({ enabled: !usesExternalSummary });
  const scopedReviewTrimmed = scopedReviewId.trim();
  const coverageHonestyQuery = useAskRunCoverageHonestyQuery(scopedReviewTrimmed, {
    enabled: scopedReviewTrimmed.length > 0,
  });
  const scopedReviewExportBlockedReason = useMemo(() => {
    if (scopedReviewTrimmed.length === 0) {
      return null;
    }

    const manifestVersion = manifestSummarySealedVersionForCopyGuard(
      coverageHonestyQuery.data?.manifestSummary ?? null,
    );

    return runCollateralSealedManifestCopyBlockedReason({
      runId: scopedReviewTrimmed,
      manifestVersion,
    });
  }, [coverageHonestyQuery.data?.manifestSummary, scopedReviewTrimmed]);
  const data = usesExternalSummary ? (summaryProp ?? null) : (summaryQuery.data ?? null);
  const failure = useMemo(
    () => (usesExternalSummary || !summaryQuery.isError ? null : toApiLoadFailure(summaryQuery.error)),
    [summaryQuery.error, summaryQuery.isError, usesExternalSummary],
  );
  const [boardPackBusy, setBoardPackBusy] = useState(false);
  const [includeBoardPackNarrative, setIncludeBoardPackNarrative] = useState(false);
  const [boardPackRecovery, setBoardPackRecovery] = useState<ErrorRecoveryContractPresentation | null>(null);
  const onDownloadSponsorSummary = useCallback(() => {
    const resolved = usesExternalSummary ? summaryProp : data;

    if (resolved === null || resolved === undefined) {
      return;
    }

    const reviewHonestyMarkdown =
      scopedReviewTrimmed.length > 0 && coverageHonestyQuery.data !== undefined
        ? formatSponsorReviewCoverageHonestyMarkdown({
            runId: scopedReviewTrimmed,
            progressSummary: coverageHonestyQuery.data.progressSummary,
            manifestSummary: coverageHonestyQuery.data.manifestSummary,
            graphSnapshot: coverageHonestyQuery.data.buyerSummary.graphSnapshot,
          })
        : "";

    const markdown = buildSponsorSummaryMarkdown(resolved, {
      reviewHonestyMarkdown,
    });

    triggerGoldenManifestMarkdownDownload(markdown, SponsorReportMarkdownFilename());
  }, [coverageHonestyQuery.data, data, scopedReviewTrimmed, summaryProp, usesExternalSummary]);

  const onDownloadBoardPack = useCallback(async () => {
    const resolved = usesExternalSummary ? summaryProp : data;

    if (resolved === null || resolved === undefined) {
      return;
    }

    setBoardPackBusy(true);
    setBoardPackRecovery(null);

    try {
      const verify = await verifyBoardPackRunLineage(
        resolved.systems.map((system) => system.runId),
        { workingDesk, skipVerify: !workingDesk || executiveSurface },
      );

      if (!verify.ok) {
        setBoardPackRecovery(verify.recovery);
        return;
      }

      await downloadSponsorRoiBoardPack({
        format: "md",
        generateNarrative: includeBoardPackNarrative,
      });
    } catch (e: unknown) {
      showError("Board pack download failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBoardPackBusy(false);
    }
  }, [
    data,
    executiveSurface,
    includeBoardPackNarrative,
    summaryProp,
    usesExternalSummary,
    workingDesk,
  ]);

  const onDownloadCsv = useCallback(async () => {
    if (scopedReviewExportBlockedReason !== null) {
      showError("CSV export blocked", scopedReviewExportBlockedReason);
      return;
    }

    try {
      const response = await fetch(
        `${SPONSOR_ROI_SUMMARY_PATH}/export`,
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
      anchor.download = "sponsor-roi-findings.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      showError("CSV export failed", e instanceof Error ? e.message : String(e));
    }
  }, [scopedReviewExportBlockedReason]);

  if (usesExternalSummary && summaryErrorProp) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{sponsorRoiSummaryCardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="alert">
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{sponsorRoiSummaryCardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatorApiProblem failure={failure} />
        </CardContent>
      </Card>
    );
  }

  const displayData = usesExternalSummary ? (summaryProp ?? null) : data;
  const showLoading = usesExternalSummary ? (loadingProp ?? false) : summaryQuery.isPending && displayData === null;

  if (showLoading || displayData === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{sponsorRoiSummaryCardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="exec-roi-summary-loading">
            Loading portfolio ROI…
          </p>
        </CardContent>
      </Card>
    );
  }

  const workspaceHasNoCommittedReviews =
    displayData.systemCount === 0 &&
    displayData.latestRunCount === 0 &&
    displayData.totalEstimatedUsdSavings === 0;
  const resolvedPortfolioSavings = resolveRunSavingsUsd({
    serverSummary: buildSponsorServerSavingsSummary(
      displayData.totalEstimatedUsdSavings,
      displayData.savingsPricingBasisDescription,
    ),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
            <span className="inline-flex items-baseline gap-1.5">
              {sponsorRoiSummaryCardTitle()}
              <RoiHeadlineMathTooltip />
            </span>
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={scopedReviewExportBlockedReason !== null}
            title={scopedReviewExportBlockedReason ?? undefined}
            onClick={() => void onDownloadCsv()}
            data-testid="exec-roi-summary-csv-download-button"
          >
            Export findings (CSV)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDownloadSponsorSummary}
            data-testid="exec-roi-summary-markdown-download-button"
          >
            Download sponsor report (Markdown)
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
        <label className={cn("flex items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <input
            type="checkbox"
            checked={includeBoardPackNarrative}
            onChange={(e) => setIncludeBoardPackNarrative(e.target.checked)}
            data-testid="exec-roi-board-pack-narrative-toggle"
          />
          {isBuyerPolishedOperatorShellEnv()
            ? "Include an AI-generated advisory narrative (off by default; not a sealed metric)."
            : "Include AI advisory narrative (off by default; uses 1 fast LLM call when enabled in API config)"}
        </label>
        <SponsorRoiBoardPackEvidenceBanner
          summary={displayData}
          includeNarrative={includeBoardPackNarrative}
        />
        {boardPackRecovery !== null ? (
          <OperatorErrorRecoveryContract
            presentation={boardPackRecovery}
            testId="exec-roi-board-pack-verify-recovery"
          />
        ) : null}
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
          Latest finalized review per system in this workspace. {BUYER_SPONSOR_DATA_SOURCE_NOTE}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resolvedPortfolioSavings !== null ? (
          <p className="sr-only" data-testid="exec-roi-resolved-source-kind">
            Resolved savings source: {resolvedPortfolioSavings.sourceKind}
          </p>
        ) : null}
        {workspaceHasNoCommittedReviews && !executiveSurface ? <DemoTenantSeedCallout /> : null}
        <SponsorRoiProofStatusStrip
          summary={displayData}
          loading={showLoading}
          executiveSurface={executiveSurface}
        />
        <SponsorRoiIdentifiedVsRealizedPanel
          summary={displayData}
          buckets={resolveSponsorRoiIdentifiedVsRealized(displayData)}
        />
        <SponsorRoiSystemsIncludedSection summary={displayData} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className={OPERATOR_KPI_CARD_TITLE}>Systems reviewed</div>
            <div className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}>
              {displayData.systemCount}
            </div>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
            <div className={OPERATOR_KPI_CARD_TITLE}>Latest reviews included</div>
            <div className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}>
              {displayData.latestRunCount}
            </div>
          </div>
        </div>

        {displayData.topSystemicIssues.length > 0 ? (
          <div>
            <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Top systemic issues</h3>
            <ul className={cn("mt-2 space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {displayData.topSystemicIssues.map((issue) => (
                <li key={`${issue.category}-${issue.severity}`}>
                  <span className="font-medium">{issue.category}</span> · {issue.severity} · {issue.count}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {executiveSurface
              ? "Start and finalize a review to populate portfolio findings and savings estimates."
              : "No finalized reviews with findings yet — load the sample workspace or start an architecture review to populate this summary."}
          </p>
        )}

        {(displayData.historicalTrends?.length ?? 0) > 0 ? (
          <div>
            <h3 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Systemic issue trends (last 6 months)
            </h3>
            <div className="mt-3">
              <SponsorRoiSystemicIssueTrendChartDeferred
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
