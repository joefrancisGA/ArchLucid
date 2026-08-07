"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { Button } from "@/components/ui/button";
import { ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER } from "@/lib/architecture-scorecard-page-copy";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
  buildReviewScorecardMethodologyLines,
  buildReviewScorecardOperationalMetrics,
  buildReviewScorecardSummaryRow,
  hasCommittedReviews,
  summarizePrimaryKpiDisplay,
} from "@/lib/pilot-scorecard-present";
import { formatUsd } from "@/lib/roi-assumptions";
import {
  REVIEW_SCORECARD_SAMPLE_BANNER_COPY,
  isReviewScorecardSampleMode,
} from "@/lib/review-scorecard-empty-state";
import { resolveReviewScorecardDisplayData } from "@/lib/review-scorecard-sample-data";

import { ArchitectureScorecardSourcesStrip } from "./ArchitectureScorecardSourcesStrip";
import { ReviewScorecardEmptyState } from "./ReviewScorecardEmptyState";
import {
  ScorecardMetricCard,
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
    canExecute,
    data,
    error,
    hours,
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
  const annualSavingsLabel = sampleLabels?.annual ?? resolvedAnnualSavingsLabel;
  const quarterlySavingsLabel = sampleLabels?.quarterly ?? resolvedQuarterlySavingsLabel;
  const statusQuoCostLabel = sampleLabels?.statusQuo ?? resolvedStatusQuoCostLabel;
  const summaryRow =
    displayData !== null ? buildReviewScorecardSummaryRow(displayData, annualSavingsLabel) : null;
  const operationalMetrics = displayData !== null ? buildReviewScorecardOperationalMetrics(displayData) : [];
  const methodologyLines =
    displayData !== null ? buildReviewScorecardMethodologyLines(displayData.metricSources) : [];
  const displayHours = sampleMode && displayData?.baselines ? String(displayData.baselines.baselineHoursPerReview ?? "") : hours;
  const displayReviews =
    sampleMode && displayData?.baselines ? String(displayData.baselines.baselineReviewsPerQuarter ?? "") : reviews;
  const displayRate =
    sampleMode && displayData?.baselines ? String(displayData.baselines.baselineArchitectHourlyCost ?? "") : rate;
  const assumptionsReadOnly = sampleMode || !canExecute || saving;

  const finalizedDisplay =
    summaryRow === null
      ? null
      : summarizePrimaryKpiDisplay(
          summaryRow.finalizedPackages,
          "Finalize a package to begin tracking completed reviews.",
        );
  const governanceDisplay =
    summaryRow === null
      ? null
      : summarizePrimaryKpiDisplay(
          summaryRow.governanceApprovals,
          "Complete your first approval to begin tracking governance metrics.",
        );

  return (
    <div className="w-full max-w-[1440px] space-y-4 px-4 py-6" data-testid="review-scorecard-page">
      <ValueReportOutcomesNav />
      <header className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{REVIEW_SCORECARD_PAGE_TITLE}</h1>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_SCORECARD_PAGE_SUBTITLE}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            <PageContextualHelpButton />
          </div>
        </div>
      </header>

      <ArchitectureScorecardSourcesStrip />

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
        <p className={OPERATOR_TYPOGRAPHY.helper} role="status">
          Loading…
        </p>
      ) : null}

      {scorecardEmpty ? <ReviewScorecardEmptyState /> : null}

      {displayData !== null && !scorecardEmpty && summaryRow !== null ? (
        <>
          <section aria-label="Primary outcomes" className="space-y-3" data-testid="review-scorecard-summary-row">
            <ScorecardSavingsHero
              empty={!summaryRow.estimatedReviewTimeSavingsReady}
              value={summaryRow.estimatedReviewTimeSavingsLabel}
              detail={summaryRow.estimatedReviewTimeSavingsDetail}
              secondaryLabel={
                summaryRow.estimatedReviewTimeSavingsReady && quarterlySavingsLabel !== null
                  ? `≈ ${quarterlySavingsLabel} per quarter`
                  : null
              }
            />

            {finalizedDisplay !== null && governanceDisplay !== null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ScorecardSummaryTile
                  label="Reviews finalized"
                  value={finalizedDisplay.value}
                  detail={
                    finalizedDisplay.empty
                      ? finalizedDisplay.detail
                      : "Finalized packages in the current workspace."
                  }
                  empty={finalizedDisplay.empty}
                  emphasis="primary"
                />
                <ScorecardSummaryTile
                  label="Governance approvals"
                  value={governanceDisplay.value}
                  detail={
                    governanceDisplay.empty
                      ? governanceDisplay.detail
                      : "Completed governance approvals in scope."
                  }
                  empty={governanceDisplay.empty}
                  emphasis="primary"
                />
              </div>
            ) : null}
          </section>

          <section aria-labelledby="scorecard-metrics">
            <h2 id="scorecard-metrics" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              Operational metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operationalMetrics.map((metric) => (
                <ScorecardMetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  detail={metric.detail}
                  empty={metric.empty}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="roi-assumptions-heading"
            className="grid gap-4 lg:grid-cols-2 lg:items-start"
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
                  : "Enter baseline assumptions to estimate review-time savings."}{" "}
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
                  />
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
                  />
                </label>
                <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="text-al-text-primary">Architect hourly cost</span>
                  <input
                    className={cn(
                      "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    value={displayRate}
                    onChange={(e) => setRate(e.target.value)}
                    inputMode="decimal"
                    disabled={assumptionsReadOnly}
                  />
                </label>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void onSaveBaselines()}
                  disabled={assumptionsReadOnly}
                  data-testid="review-scorecard-save-assumptions"
                >
                  {saving ? "Saving…" : "Save ROI assumptions"}
                </Button>
                {!canExecute && !sampleMode ? (
                  <p className={OPERATOR_TYPOGRAPHY.helper}>
                    Sign in with an account that can update workspace assumptions to save ROI inputs.
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="rounded-lg border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid="review-scorecard-roi-estimate"
              aria-labelledby="roi-estimate"
            >
              <h2 id="roi-estimate" className={OPERATOR_NAV_GROUP_LABEL}>
                Estimated savings
              </h2>
              {displayData.roiEstimate ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Annual estimated savings
                    </p>
                    <p className={cn("m-0 mt-1 font-mono text-4xl font-semibold tabular-nums text-al-text-primary")}>
                      {annualSavingsLabel ?? "—"}
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
              ) : (
                <p className={cn("mt-4", OPERATOR_TYPOGRAPHY.body)} data-testid="review-scorecard-roi-estimate-empty">
                  Complete and save ROI assumptions to calculate estimated annual savings. The result appears here and
                  in the savings hero above.
                </p>
              )}
            </div>
          </section>

          <CollapsibleSection title="How this is calculated" defaultOpen={false} sectionTestId="review-scorecard-methodology">
            <ul className={cn("m-0 list-disc space-y-2 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {methodologyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>
                ROI estimates apply a 50% review-time reduction lever once all three assumptions are saved.{" "}
                <Link href="/insights/roi-summary" className={OPERATOR_LINK.inline}>
                  See ROI summary
                </Link>{" "}
                for related value reporting.
              </li>
            </ul>
          </CollapsibleSection>
        </>
      ) : null}
    </div>
  );
}
