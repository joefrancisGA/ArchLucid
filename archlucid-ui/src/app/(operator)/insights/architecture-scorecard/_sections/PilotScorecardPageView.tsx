"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER,
  ARCHITECTURE_SCORECARD_SOURCES,
  ARCHITECTURE_SCORECARD_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-page-copy";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import {
  REVIEW_SCORECARD_FINALIZED_HREF,
  REVIEW_SCORECARD_GOVERNANCE_HREF,
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
  REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF,
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

import { ReviewScorecardEmptyState } from "./ReviewScorecardEmptyState";
import {
  ScorecardMetricCard,
  ScorecardSavingsClaimDiscipline,
  ScorecardSavingsHero,
  ScorecardSummaryTile,
} from "./ScorecardMetricCard";
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
  const searchParams = useSearchParams();
  const sampleMode = isReviewScorecardSampleMode(searchParams);

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

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4" data-testid="review-scorecard-page">
      <ValueReportOutcomesNav />
      <ScorecardRoiVocabularyRail currentSurfaceId="scorecard" />
      <header className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{REVIEW_SCORECARD_PAGE_TITLE}</h1>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_SCORECARD_PAGE_SUBTITLE}</p>
            {scopeCue !== null ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-scorecard-scope-cue">
                {scopeCue}
              </p>
            ) : null}
            {metricsAsOfLabel !== null ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="review-scorecard-metrics-as-of"
              >
                {metricsAsOfLabel}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end print:hidden">
            <PageContextualHelpButton />
            <nav
              aria-label="Related value reports"
              className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
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
        </div>
      </header>

      <section
        className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
        aria-labelledby="architecture-scorecard-sources-heading"
        data-testid="architecture-scorecard-sources"
      >
        <h2 id="architecture-scorecard-sources-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
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

      {displayData !== null && !scorecardEmpty && summaryRow !== null ? (
        <>
          <section aria-label="Primary outcomes" className="space-y-3" data-testid="review-scorecard-summary-row">
            {!savingsReady ? (
              <>
                {finalizedDisplay !== null && governanceDisplay !== null ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ScorecardSummaryTile
                      label="Reviews finalized"
                      value={finalizedDisplay.value}
                      detail={
                        finalizedDisplay.state === "measured"
                          ? "Finalized packages in the current workspace."
                          : finalizedDisplay.detail
                      }
                      empty={finalizedDisplay.empty}
                      metricState={finalizedDisplay.state}
                      useKpiEmphasis={finalizedDisplay.useKpiEmphasis}
                      emphasis="primary"
                      href={REVIEW_SCORECARD_FINALIZED_HREF}
                      drillDownLabel="View architecture reviews"
                    />
                    <ScorecardSummaryTile
                      label="Governance approvals"
                      value={governanceDisplay.value}
                      detail={
                        governanceDisplay.state === "measured"
                          ? "Completed governance approvals in scope."
                          : governanceDisplay.detail
                      }
                      empty={governanceDisplay.empty}
                      metricState={governanceDisplay.state}
                      useKpiEmphasis={governanceDisplay.useKpiEmphasis}
                      emphasis="primary"
                      href={REVIEW_SCORECARD_GOVERNANCE_HREF}
                      drillDownLabel="View approval queue"
                    />
                  </div>
                ) : null}

                <section aria-labelledby="scorecard-metrics">
                  <h2 id="scorecard-metrics" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
                    Operational metrics
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {operationalMetrics.map((metric) => (
                      <ScorecardMetricCard
                        key={metric.key}
                        title={metric.title}
                        value={metric.value}
                        detail={metric.detail}
                        empty={metric.empty}
                        metricState={metric.metricState}
                        useKpiEmphasis={metric.useKpiEmphasis}
                        href={metric.href}
                        drillDownLabel={metric.drillDownLabel}
                        sourceDisclosure={metric.sourceDisclosure}
                      />
                    ))}
                  </div>
                </section>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
                  <ScorecardSavingsHero
                    compact
                    empty={!summaryRow.estimatedReviewTimeSavingsReady}
                    value={summaryRow.estimatedReviewTimeSavingsLabel}
                    detail={summaryRow.estimatedReviewTimeSavingsDetail}
                    actionHref={!summaryRow.estimatedReviewTimeSavingsReady ? REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF : null}
                    actionLabel={!summaryRow.estimatedReviewTimeSavingsReady ? "Configure ROI assumptions" : null}
                  />
                  <ScorecardSavingsClaimDiscipline>{ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE}</ScorecardSavingsClaimDiscipline>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
                  <ScorecardSavingsHero
                    empty={false}
                    value={summaryRow.estimatedReviewTimeSavingsLabel}
                    detail={
                      showPreviewBadge
                        ? `${summaryRow.estimatedReviewTimeSavingsDetail} Preview updates as you edit — save to persist for the workspace.`
                        : summaryRow.estimatedReviewTimeSavingsDetail
                    }
                    secondaryLabel={
                      quarterlySavingsLabel !== null ? `≈ ${quarterlySavingsLabel} per quarter` : null
                    }
                  />
                  <ScorecardSavingsClaimDiscipline>{ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE}</ScorecardSavingsClaimDiscipline>
                </div>

                {finalizedDisplay !== null && governanceDisplay !== null ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ScorecardSummaryTile
                      label="Reviews finalized"
                      value={finalizedDisplay.value}
                      detail={
                        finalizedDisplay.state === "measured"
                          ? "Finalized packages in the current workspace."
                          : finalizedDisplay.detail
                      }
                      empty={finalizedDisplay.empty}
                      metricState={finalizedDisplay.state}
                      useKpiEmphasis={finalizedDisplay.useKpiEmphasis}
                      emphasis="primary"
                      href={REVIEW_SCORECARD_FINALIZED_HREF}
                      drillDownLabel="View architecture reviews"
                    />
                    <ScorecardSummaryTile
                      label="Governance approvals"
                      value={governanceDisplay.value}
                      detail={
                        governanceDisplay.state === "measured"
                          ? "Completed governance approvals in scope."
                          : governanceDisplay.detail
                      }
                      empty={governanceDisplay.empty}
                      metricState={governanceDisplay.state}
                      useKpiEmphasis={governanceDisplay.useKpiEmphasis}
                      emphasis="primary"
                      href={REVIEW_SCORECARD_GOVERNANCE_HREF}
                      drillDownLabel="View approval queue"
                    />
                  </div>
                ) : null}

                <section aria-labelledby="scorecard-metrics-ready">
                  <h2 id="scorecard-metrics-ready" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
                    Operational metrics
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {operationalMetrics.map((metric) => (
                      <ScorecardMetricCard
                        key={metric.key}
                        title={metric.title}
                        value={metric.value}
                        detail={metric.detail}
                        empty={metric.empty}
                        metricState={metric.metricState}
                        useKpiEmphasis={metric.useKpiEmphasis}
                        href={metric.href}
                        drillDownLabel={metric.drillDownLabel}
                        sourceDisclosure={metric.sourceDisclosure}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </section>

          <section
            aria-labelledby="roi-assumptions-heading"
            className={cn("grid gap-4 lg:items-start", showRoiEstimatePanel ? "lg:grid-cols-2" : "")}
            id="roi-assumptions"
            data-testid="review-scorecard-roi-assumptions"
          >
            <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 id="roi-assumptions-heading" className={OPERATOR_NAV_GROUP_LABEL}>
                ROI assumptions
              </h2>
              <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                {sampleMode
                  ? "Illustrative assumptions shown for evaluation — edit your workspace data to model real savings."
                  : "Enter baseline assumptions to preview review-time savings, then save for the workspace."}{" "}
                {ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER}
              </p>
              <div className="mt-4 grid gap-3">
                <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="text-al-text-primary">Hours saved per review</span>
                  <input
                    className={cn(
                      "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    value={displayHours}
                    onChange={(e) => setHours(e.target.value)}
                    inputMode="decimal"
                    disabled={assumptionsReadOnly}
                    aria-invalid={fieldErrors.hours !== null}
                    aria-describedby={fieldErrors.hours !== null ? "scorecard-hours-error" : undefined}
                  />
                  {fieldErrors.hours !== null ? (
                    <p id="scorecard-hours-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                      {fieldErrors.hours}
                    </p>
                  ) : null}
                </label>
                <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="text-al-text-primary">Reviews per quarter</span>
                  <input
                    className={cn(
                      "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    value={displayReviews}
                    onChange={(e) => setReviews(e.target.value)}
                    inputMode="numeric"
                    disabled={assumptionsReadOnly}
                    aria-invalid={fieldErrors.reviews !== null}
                    aria-describedby={fieldErrors.reviews !== null ? "scorecard-reviews-error" : undefined}
                  />
                  {fieldErrors.reviews !== null ? (
                    <p id="scorecard-reviews-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                      {fieldErrors.reviews}
                    </p>
                  ) : null}
                </label>
                <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="text-al-text-primary">Architect hourly cost ($/hour)</span>
                  <input
                    className={cn(
                      "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    value={displayRate}
                    onChange={(e) => setRate(e.target.value)}
                    inputMode="decimal"
                    disabled={assumptionsReadOnly}
                    aria-invalid={fieldErrors.rate !== null}
                    aria-describedby={fieldErrors.rate !== null ? "scorecard-rate-error" : undefined}
                  />
                  {fieldErrors.rate !== null ? (
                    <p id="scorecard-rate-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                      {fieldErrors.rate}
                    </p>
                  ) : null}
                </label>
                {saveReadinessMessage !== null ? (
                  <p
                    id={saveReadinessId}
                    className={OPERATOR_TYPOGRAPHY.helper}
                    data-testid="review-scorecard-assumptions-incomplete"
                  >
                    {saveReadinessMessage}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void onSaveBaselines()}
                  disabled={sampleMode || !canSaveAssumptions}
                  aria-describedby={saveReadinessMessage !== null ? saveReadinessId : undefined}
                  className="disabled:bg-neutral-200 disabled:text-neutral-700 disabled:opacity-100 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-200"
                  data-testid="review-scorecard-save-assumptions"
                >
                  {saving ? "Saving…" : "Save ROI assumptions"}
                </Button>
              </div>
            </div>

            {showRoiEstimatePanel ? (
              <div
                className="rounded-lg border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised p-4 dark:border-neutral-800"
                data-testid="review-scorecard-roi-estimate"
                aria-labelledby="roi-estimate"
              >
                <h2 id="roi-estimate" className={OPERATOR_NAV_GROUP_LABEL}>
                  Estimated savings
                </h2>
                {showPreviewBadge ? (
                  <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-scorecard-roi-preview-badge">
                    Live preview — save to persist for sponsor exports.
                  </p>
                ) : null}
                {annualSavingsLabel !== null ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        Annual estimated savings
                      </p>
                      <p className={cn("m-0 mt-1 font-mono text-4xl font-semibold tabular-nums text-al-text-primary")}>
                        {annualSavingsLabel}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          Quarterly estimate
                        </p>
                        <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {quarterlySavingsLabel ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          Status quo annual labor
                        </p>
                        <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {statusQuoCostLabel ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <CollapsibleSection title="How this is calculated" defaultOpen={true} sectionTestId="review-scorecard-methodology">
            <ul className={cn("m-0 list-disc space-y-2 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {methodologyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>
                ROI estimates apply a 50% review-time reduction lever once all three assumptions are provided.{" "}
                <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={OPERATOR_LINK.inline}>
                  See ROI summary
                </Link>{" "}
                for related value reporting.
              </li>
            </ul>
          </CollapsibleSection>
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
