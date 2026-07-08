"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { Button } from "@/components/ui/button";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  REVIEW_SCORECARD_PAGE_TITLE,
  buildReviewScorecardMethodologyLines,
  buildReviewScorecardOperationalMetrics,
  buildReviewScorecardSummaryRow,
  hasCommittedReviews,
} from "@/lib/pilot-scorecard-present";

import { ReviewScorecardEmptyState } from "./ReviewScorecardEmptyState";
import { ScorecardMetricCard, ScorecardSummaryTile } from "./ScorecardMetricCard";
import type { UsePilotScorecardPageModel } from "./use-pilot-scorecard-page";

type PilotScorecardPageViewProps = {
  model: UsePilotScorecardPageModel;
};

export function PilotScorecardPageView({ model }: PilotScorecardPageViewProps) {
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

  const scorecardEmpty = data !== null && !hasCommittedReviews(data);
  const summaryRow = data !== null ? buildReviewScorecardSummaryRow(data, resolvedAnnualSavingsLabel) : null;
  const operationalMetrics = data !== null ? buildReviewScorecardOperationalMetrics(data) : [];
  const methodologyLines =
    data !== null ? buildReviewScorecardMethodologyLines(data.metricSources) : [];

  return (
    <div className="w-full max-w-[1440px] space-y-8 px-4 py-8" data-testid="review-scorecard-page">
      <ValueReportOutcomesNav />
      <header className="space-y-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{REVIEW_SCORECARD_PAGE_TITLE}</h1>
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_SCORECARD_PAGE_SUBTITLE}</p>
      </header>

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

      {data !== null && !scorecardEmpty ? (
        <>
          {summaryRow !== null ? (
            <section
              aria-label="Executive summary"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              data-testid="review-scorecard-summary-row"
            >
              <ScorecardSummaryTile
                label="Review packages finalized"
                value={String(summaryRow.finalizedPackages)}
                detail={
                  summaryRow.finalizedPackages === 0
                    ? "No finalized review packages yet."
                    : "Finalized packages in the current workspace."
                }
              />
              <ScorecardSummaryTile
                label="Findings affirmed"
                value={String(summaryRow.affirmedFindings)}
                detail={
                  summaryRow.affirmedFindings === 0
                    ? "No affirmed findings yet."
                    : "Findings with positive reviewer feedback."
                }
              />
              <ScorecardSummaryTile
                label="Governance approvals"
                value={String(summaryRow.governanceApprovals)}
                detail={
                  summaryRow.governanceApprovals === 0
                    ? "No governance approvals completed yet."
                    : "Completed governance approvals in scope."
                }
              />
              <ScorecardSummaryTile
                label="Estimated review-time savings"
                value={summaryRow.estimatedReviewTimeSavingsLabel}
                detail={summaryRow.estimatedReviewTimeSavingsDetail}
              />
            </section>
          ) : null}

          <section aria-labelledby="scorecard-metrics">
            <h2 id="scorecard-metrics" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              Review throughput
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operationalMetrics.map((metric) => (
                <ScorecardMetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  detail={metric.detail}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="roi-assumptions-heading"
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            id="roi-assumptions"
          >
            <h2 id="roi-assumptions-heading" className={OPERATOR_NAV_GROUP_LABEL}>
              ROI assumptions
            </h2>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              Enter baseline assumptions to estimate review-time savings.
            </p>
            <div className="mt-4 grid max-w-lg gap-3">
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Hours saved per review</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  inputMode="decimal"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Reviews per quarter</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={reviews}
                  onChange={(e) => setReviews(e.target.value)}
                  inputMode="numeric"
                  disabled={!canExecute || saving}
                />
              </label>
              <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
                <span className="text-al-text-primary">Architect hourly cost</span>
                <input
                  className={cn(
                    "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  inputMode="decimal"
                  disabled={!canExecute || saving}
                />
              </label>
              <Button
                type="button"
                variant="primary"
                onClick={() => void onSaveBaselines()}
                disabled={!canExecute || saving}
                data-testid="review-scorecard-save-assumptions"
              >
                {saving ? "Saving…" : "Save ROI assumptions"}
              </Button>
              {!canExecute ? (
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  Sign in with an account that can update workspace assumptions to save ROI inputs.
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="roi-estimate" data-testid="review-scorecard-roi-estimate">
            <h2 id="roi-estimate" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              ROI estimate
            </h2>
            {data.roiEstimate ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ScorecardMetricCard
                  title="Quarterly estimated savings"
                  value={resolvedQuarterlySavingsLabel ?? "—"}
                  detail="Estimated review-time savings per quarter from saved assumptions."
                />
                <ScorecardMetricCard
                  title="Annual estimated savings"
                  value={resolvedAnnualSavingsLabel ?? "—"}
                  detail="Estimated review-time savings per year from saved assumptions."
                />
                <ScorecardMetricCard
                  title="Status quo annual review labor"
                  value={resolvedStatusQuoCostLabel ?? "—"}
                  detail="Modeled annual review labor before estimated savings."
                />
              </div>
            ) : (
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                Complete ROI assumptions to calculate estimated savings.
              </p>
            )}
          </section>

          <CollapsibleSection title="How this is calculated" defaultOpen={false} sectionTestId="review-scorecard-methodology">
            <ul className={cn("m-0 list-disc space-y-2 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {methodologyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>
                ROI estimates apply a 50% review-time reduction lever once all three assumptions are saved.{" "}
                <Link href="/value-report/roi" className={OPERATOR_LINK.inline}>
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
