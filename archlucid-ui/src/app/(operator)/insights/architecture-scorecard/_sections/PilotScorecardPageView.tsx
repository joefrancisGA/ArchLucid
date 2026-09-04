"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { DocumentLayout } from "@/components/DocumentLayout";
import { ArchitectureScorecardBreadcrumb } from "@/components/insights/ArchitectureScorecardBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ReportSurfaceCanonicalPointerStrip } from "@/components/reports/ReportSurfaceCanonicalPointerStrip";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import {
  ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID,
  ARCHITECTURE_SCORECARD_SKIP_LINK_LABEL,
  ARCHITECTURE_SCORECARD_SOURCES,
  ARCHITECTURE_SCORECARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-scorecard-page-copy";
import { ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE } from "@/lib/architecture/architecture-scorecard-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
  buildReviewScorecardMetricsAsOfLabel,
  buildReviewScorecardMethodologyLines,
  buildReviewScorecardOperationalMetrics,
  buildReviewScorecardScopeCue,
  buildReviewScorecardSummaryRow,
  hasCommittedReviews,
  hasReviewActivity,
  summarizePrimaryKpiDisplay,
} from "@/lib/pilot-scorecard-present";
import { formatUsd } from "@/lib/roi-assumptions";
import {
  REVIEW_SCORECARD_SAMPLE_BANNER_COPY,
  isReviewScorecardSampleMode,
} from "@/lib/review-scorecard-empty-state";
import { resolveReviewScorecardDisplayData } from "@/lib/review-scorecard-sample-data";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import {
  resolveScorecardScoringEmphasizedStepId,
  resolveScorecardScoringSteps,
} from "@/lib/scorecard-scoring-checklist";

import { ArchitectureScorecardBuyerChrome } from "./ArchitectureScorecardBuyerChrome";
import { PilotScorecardMethodology } from "./PilotScorecardMethodology";
import { PilotScorecardPrimaryOutcomes } from "./PilotScorecardPrimaryOutcomes";
import { PilotScorecardRoiPanel } from "./PilotScorecardRoiPanel";
import { ReviewScorecardEmptyState } from "./ReviewScorecardEmptyState";
import { ScorecardReviewPickerStrip } from "./ScorecardReviewPickerStrip";
import { ScorecardNextReviewFooterClient } from "./ScorecardNextReviewFooterClient";
import type { UsePilotScorecardPageModel } from "./use-pilot-scorecard-page";

type PilotScorecardPageViewProps = {
  model: UsePilotScorecardPageModel;
};

function resolveSampleSavingsLabels(data: NonNullable<ReturnType<typeof resolveReviewScorecardDisplayData>>): {
  annual: string | null;
  quarterly: string | null;
  statusQuo: string | null;
} {
  const roiEstimate = data.roiEstimate;

  if (roiEstimate === null || roiEstimate === undefined) {
    return { annual: null, quarterly: null, statusQuo: null };
  }

  return {
    annual: formatUsd(roiEstimate.annualReviewSavingsFromReviewTimeLeverUsd),
    quarterly: formatUsd(roiEstimate.annualReviewSavingsFromReviewTimeLeverUsd / 4),
    statusQuo: formatUsd(roiEstimate.annualReviewCostStatusQuoUsd),
  };
}

export function PilotScorecardPageView({ model }: PilotScorecardPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sampleMode = isReviewScorecardSampleMode(searchParams);
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForScoring = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${ARCHITECTURE_SCORECARD_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const {
    assumptionsComplete,
    assumptionsDirty,
    canExecute,
    canSaveAssumptions,
    data,
    error,
    fieldErrors,
    hours,
    livePreview,
    metricsAsOfUtc,
    onSaveBaselines,
    rate,
    resolvedAnnualSavingsLabel,
    resolvedQuarterlySavingsLabel,
    resolvedStatusQuoCostLabel,
    reviews,
    saving,
    setHours,
    setRate,
    setReviews,
  } = model;

  const displayData = useMemo(() => resolveReviewScorecardDisplayData(data, sampleMode), [data, sampleMode]);
  const scorecardEmpty = data !== null && !hasCommittedReviews(data) && !sampleMode;
  const sampleLabels = sampleMode && displayData !== null ? resolveSampleSavingsLabels(displayData) : null;
  const previewActive = !sampleMode && livePreview !== null;
  const annualSavingsLabel =
    sampleLabels?.annual ?? (previewActive ? livePreview!.annualSavingsLabel : resolvedAnnualSavingsLabel);
  const quarterlySavingsLabel =
    sampleLabels?.quarterly ?? (previewActive ? livePreview!.quarterlySavingsLabel : resolvedQuarterlySavingsLabel);
  const statusQuoCostLabel =
    sampleLabels?.statusQuo ?? (previewActive ? livePreview!.statusQuoCostLabel : resolvedStatusQuoCostLabel);
  const summaryRow =
    displayData !== null ? buildReviewScorecardSummaryRow(displayData, annualSavingsLabel) : null;
  const operationalMetrics = displayData !== null ? buildReviewScorecardOperationalMetrics(displayData) : [];
  const methodologyLines =
    displayData !== null ? buildReviewScorecardMethodologyLines(displayData.metricSources) : [];
  const scopeCue = displayData !== null ? buildReviewScorecardScopeCue(displayData) : null;
  const metricsAsOfLabel = buildReviewScorecardMetricsAsOfLabel(metricsAsOfUtc);
  const displayHours = sampleMode && displayData?.baselines ? String(displayData.baselines.baselineHoursPerReview ?? "") : hours;
  const displayReviews =
    sampleMode && displayData?.baselines ? String(displayData.baselines.baselineReviewsPerQuarter ?? "") : reviews;
  const displayRate =
    sampleMode && displayData?.baselines ? String(displayData.baselines.baselineArchitectHourlyCost ?? "") : rate;
  const assumptionsReadOnly = sampleMode || !canExecute || saving;
  const showPreviewBadge = previewActive && (assumptionsDirty || resolvedAnnualSavingsLabel === null);
  const savingsReady = summaryRow?.estimatedReviewTimeSavingsReady === true;
  const showRoiEstimatePanel = savingsReady || annualSavingsLabel !== null;
  const reviewActivity = displayData !== null ? hasReviewActivity(displayData) : false;
  const saveReadinessId = "scorecard-save-readiness";

  const finalizedDisplay =
    summaryRow === null || displayData === null
      ? null
      : summarizePrimaryKpiDisplay(
          summaryRow.finalizedPackages,
          "Finalize a package to begin tracking completed reviews.",
          reviewActivity,
        );
  const governanceDisplay =
    summaryRow === null || displayData === null
      ? null
      : summarizePrimaryKpiDisplay(
          summaryRow.governanceApprovals,
          "Complete your first approval to begin tracking governance metrics.",
          reviewActivity,
        );

  const saveReadinessMessage =
    !canExecute && !sampleMode
      ? "Sign in with an account that can update workspace assumptions to save ROI inputs."
      : canExecute && !sampleMode && !assumptionsComplete
        ? "Enter all three values greater than zero to enable save."
        : null;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showScorecardReviewPicker =
    displayData !== null && !scorecardEmpty && !sampleMode && !scopedRunFilterActive;
  const showScorecardMetrics = displayData !== null && !scorecardEmpty && (sampleMode || scopedRunFilterActive);
  const scorecardScoringChecklistSteps = resolveScorecardScoringSteps({
    reviewPicked: scopedRunFilterActive,
    metricsReviewed: showScorecardMetrics,
    exportReady: showScorecardMetrics,
  });
  const scorecardScoringChecklistEmphasizedStepId = resolveScorecardScoringEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    metricsReviewed: showScorecardMetrics,
    exportReady: showScorecardMetrics,
  });

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4" data-testid="review-scorecard-page">
      <ValueReportOutcomesNav />
      {buyerPolishedShell ? null : <ScorecardRoiVocabularyRail currentSurfaceId="scorecard" />}
      <a
        href={`#${ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ARCHITECTURE_SCORECARD_SKIP_LINK_LABEL}
      </a>
      <DocumentLayout>
        <div
          id={ARCHITECTURE_SCORECARD_PRIMARY_CONTENT_ID}
          data-testid="architecture-scorecard-primary-content"
          className="scroll-mt-24 space-y-4"
        >
          <OperatorPageHeader
            navHref={ARCHITECTURE_SCORECARD_PATH}
            title={REVIEW_SCORECARD_PAGE_TITLE}
            headingLevel="h1"
            breadcrumb={buyerPolishedShell ? <ArchitectureScorecardBreadcrumb /> : undefined}
            subtitle={REVIEW_SCORECARD_PAGE_SUBTITLE}
            claimDiscipline={ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE}
            claimDisciplineTestId="architecture-scorecard-claim-discipline"
            metadata={
              <>
                {scopeCue !== null ? (
                  <span
                    className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="review-scorecard-scope-cue"
                  >
                    {scopeCue}
                  </span>
                ) : null}
                {metricsAsOfLabel !== null ? (
                  <span
                    className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="review-scorecard-metrics-as-of"
                  >
                    {metricsAsOfLabel}
                  </span>
                ) : null}
              </>
            }
            actions={
              buyerPolishedShell ? (
                <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
              ) : (
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end print:hidden">
                  <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
                  <nav
                    aria-label="Related value reports"
                    className={cn(
                      "flex flex-wrap items-center gap-x-3 gap-y-1 text-al-text-secondary",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={OPERATOR_LINK.inline}>
                      ROI summary
                    </Link>
                    <Link href="/administration/baseline" className={OPERATOR_LINK.inline}>
                      Baseline settings
                    </Link>
                    <Link href={GOVERNANCE_WORKSPACE_HEALTH_HREF} className={OPERATOR_LINK.inline}>
                      Workspace health
                    </Link>
                  </nav>
                </div>
              )
            }
          />

          <ReportSurfaceCanonicalPointerStrip surfaceId="architecture-scorecard" />

          <ArchitectureScorecardBuyerChrome />

          {buyerPolishedShell ? null : (
            <section
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
              aria-labelledby="architecture-scorecard-sources-heading"
              data-testid="architecture-scorecard-sources"
            >
              <h2
                id="architecture-scorecard-sources-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Sources
              </h2>
              <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {ARCHITECTURE_SCORECARD_SOURCES_INTRO}
              </p>
              <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
                {ARCHITECTURE_SCORECARD_SOURCES.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

      {sampleMode ? (
        <div
          role="status"
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-neutral-700",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="review-scorecard-sample-banner"
        >
          {REVIEW_SCORECARD_SAMPLE_BANNER_COPY}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="review-scorecard-error"
        >
          {error}
        </div>
      ) : null}

      {data === null && !error ? (
        <div className="space-y-3" role="status" aria-live="polite" data-testid="review-scorecard-loading">
          <p className={OPERATOR_TYPOGRAPHY.helper}>Loading scorecard…</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />
            <div className="h-24 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />
          </div>
        </div>
      ) : null}

      {scorecardEmpty ? <ReviewScorecardEmptyState /> : null}

      {scopedRunFilterActive && !sampleMode && !scorecardEmpty ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="review-scorecard-run-scope-banner"
        >
          {"Scorecard scoped to review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={ARCHITECTURE_SCORECARD_PATH}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {scopedRunFilterActive && !sampleMode ? (
        <IntegrationConnectChecklist
          title="Scoring checklist"
          steps={scorecardScoringChecklistSteps}
          emphasizedStepId={scorecardScoringChecklistEmphasizedStepId}
          testIdPrefix="scorecard-scoring"
        />
      ) : null}

      {showScorecardReviewPicker ? (
        <ScorecardReviewPickerStrip
          selectedReviewId=""
          onSelectReview={onPickReviewForScoring}
        />
      ) : null}

      {showScorecardMetrics && summaryRow !== null ? (
        <>
          <PilotScorecardPrimaryOutcomes
            savingsReady={savingsReady}
            finalizedDisplay={finalizedDisplay}
            governanceDisplay={governanceDisplay}
            operationalMetrics={operationalMetrics}
            summaryRow={summaryRow}
            showPreviewBadge={showPreviewBadge}
            quarterlySavingsLabel={quarterlySavingsLabel}
          />

          <PilotScorecardRoiPanel
            showRoiEstimatePanel={showRoiEstimatePanel}
            sampleMode={sampleMode}
            displayHours={displayHours}
            displayReviews={displayReviews}
            displayRate={displayRate}
            fieldErrors={fieldErrors}
            assumptionsReadOnly={assumptionsReadOnly}
            saveReadinessMessage={saveReadinessMessage}
            saveReadinessId={saveReadinessId}
            onSaveBaselines={onSaveBaselines}
            canSaveAssumptions={canSaveAssumptions}
            saving={saving}
            setHours={setHours}
            setReviews={setReviews}
            setRate={setRate}
            showPreviewBadge={showPreviewBadge}
            annualSavingsLabel={annualSavingsLabel}
            quarterlySavingsLabel={quarterlySavingsLabel}
            statusQuoCostLabel={statusQuoCostLabel}
          />

          <PilotScorecardMethodology methodologyLines={methodologyLines} />
        </>
      ) : null}
      {scopedRunFilterActive ? (
        <ScorecardNextReviewFooterClient runId={scopedRunId} />
      ) : null}
        </div>
      </DocumentLayout>
    </OperatorPageContainer>
  );
}
