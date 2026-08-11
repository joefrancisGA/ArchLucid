"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { PilotFeedbackRecommendationLearningVocabularyRail } from "@/components/PilotFeedbackRecommendationLearningVocabularyRail";
import { SeverityTag } from "@/components/ui/severity-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  buildProductLearningReportFileUrl,
  buildProductLearningReportJsonUrl,
} from "@/lib/product-learning-report-urls";
import { BUYER_TERMINOLOGY, PILOT_FEEDBACK_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import {
  formatUtc,
  productLearningNumericCellClass,
  productLearningTableClass,
  productLearningThTdClass,
  sinceIsoForRange,
} from "./product-learning-page-helpers";
import { PlanningBridgePanel } from "./PlanningBridgePanel";
import type { ProductLearningTimeRangeKey } from "./product-learning-types";
import type { ProductLearningPageViewModel } from "./product-learning-view-model";

type Props = {
  readonly model: ProductLearningPageViewModel;
};

/**
 * Pilot feedback dashboard: outcome trends, opportunities, and improvement planning — distinct from advisory recommendation learning.
 */
export function ProductLearningPageView(props: Props) {
  const m = props.model;
  const emptyDataset = m.bundle !== null && m.bundle.summary.totalSignalsInScope === 0;
  const showPopulatedSections = m.bundle !== null && !emptyDataset;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="mt-0">{BUYER_TERMINOLOGY.evaluationFeedback}</h2>
          <p className={cn("max-w-3xl leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
            {PILOT_FEEDBACK_VOCABULARY.pageLead} This view is separate from{" "}
            <Link href="/internal/recommendation-learning" className={OPERATOR_LINK.inline}>
              AI recommendation learning
            </Link>{" "}
            (advisory acceptance weights).
          </p>
        </div>
        <PageContextualHelpButton />
      </div>

      <div className="mt-4 mb-5">
        <PilotFeedbackRecommendationLearningVocabularyRail currentSurfaceId="pilot-feedback" />
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5 mt-4">
        <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <span className={OPERATOR_TYPOGRAPHY.helper}>Time range</span>
          <select
            className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            value={m.range}
            onChange={(e) => {
              m.setRange(e.target.value as ProductLearningTimeRangeKey);
            }}
            disabled={m.loading}
            aria-label="Filter pilot feedback by time range"
          >
            <option value="all">All time</option>
            <option value="30d">Last 30 days</option>
            <option value="7d">Last 7 days</option>
          </select>
        </label>
        <button type="button" onClick={() => void m.load()} disabled={m.loading}>
          Refresh
        </button>
      </div>

      {showPopulatedSections ? (
        <section className="mb-[22px]" aria-labelledby="pl-export-heading">
          <h3 id="pl-export-heading" className={cn("mb-1.5", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {PILOT_FEEDBACK_VOCABULARY.exportSectionHeading}
          </h3>
          <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
            {PILOT_FEEDBACK_VOCABULARY.exportSectionLead} Uses the same scope and time range as the dashboard above.
          </p>
          <p className={cn("mt-2.5", OPERATOR_TYPOGRAPHY.body)}>
            <a href={buildProductLearningReportFileUrl("markdown", sinceIsoForRange(m.range))} download>
              Download Markdown
            </a>
            {" · "}
            <a href={buildProductLearningReportFileUrl("json", sinceIsoForRange(m.range))} download>
              Download JSON
            </a>
            {" · "}
            <a href={buildProductLearningReportJsonUrl(sinceIsoForRange(m.range))} target="_blank" rel="noopener noreferrer">
              Open JSON in new tab
            </a>
          </p>
        </section>
      ) : null}

      {m.loading && m.bundle === null ? (
        <OperatorLoadingNotice>
          <strong>Loading dashboard.</strong>
          <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Fetching feedback summaries, trends, opportunities, and review items…</p>
        </OperatorLoadingNotice>
      ) : null}

      {m.loading && m.bundle !== null ? (
        <p className={cn("mb-4", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Updating…
        </p>
      ) : null}

      {m.failure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {emptyDataset && !m.loading ? (
        <EmptyState
          title={PILOT_FEEDBACK_VOCABULARY.emptyStateTitle}
          description={PILOT_FEEDBACK_VOCABULARY.emptyStateDescription}
          actions={[
            { label: PILOT_FEEDBACK_VOCABULARY.emptyStatePrimaryAction, href: "/architecture/reviews" },
            { label: PILOT_FEEDBACK_VOCABULARY.emptyStateSecondaryAction, href: "/architecture/reviews/new" },
          ]}
        />
      ) : null}

      {showPopulatedSections ? (
        <>
          <section className="mb-7" aria-labelledby="pl-kpis-heading">
            <h3 id="pl-kpis-heading" className={cn("mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Summary
            </h3>
            <p className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>
              Generated {formatUtc(m.bundle!.summary.generatedUtc)} · {m.bundle!.summary.totalSignalsInScope} feedback
              item(s) · {m.bundle!.summary.distinctRunsTouched} review(s) with feedback
            </p>
            <ul className="flex flex-wrap gap-2.5 list-none p-0 mt-3">
              <li className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 min-w-[140px]">
                <div className={OPERATOR_KPI_CARD_TITLE}>
                  {PILOT_FEEDBACK_VOCABULARY.summaryKpiFeedbackSummaries}
                </div>
                <div className={OPERATOR_TYPOGRAPHY.pageTitle}>{m.bundle!.summary.topAggregateCount}</div>
              </li>
              <li className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 min-w-[140px]">
                <div className={OPERATOR_KPI_CARD_TITLE}>
                  {PILOT_FEEDBACK_VOCABULARY.summaryKpiRepeatedIssues}
                </div>
                <div className={OPERATOR_TYPOGRAPHY.pageTitle}>{m.bundle!.summary.artifactTrendCount}</div>
              </li>
              <li className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 min-w-[140px]">
                <div className={OPERATOR_KPI_CARD_TITLE}>
                  {PILOT_FEEDBACK_VOCABULARY.summaryKpiImprovementOpportunities}
                </div>
                <div className={OPERATOR_TYPOGRAPHY.pageTitle}>{m.bundle!.summary.improvementOpportunityCount}</div>
              </li>
              <li className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3.5 py-2.5 min-w-[140px]">
                <div className={OPERATOR_KPI_CARD_TITLE}>
                  {PILOT_FEEDBACK_VOCABULARY.summaryKpiItemsNeedingReview}
                </div>
                <div className={OPERATOR_TYPOGRAPHY.pageTitle}>{m.bundle!.summary.triageQueueItemCount}</div>
              </li>
            </ul>
            <details className="mt-4">
              <summary className={cn("cursor-pointer text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {PILOT_FEEDBACK_VOCABULARY.summaryNotesHeading}
              </summary>
              <ul className={cn("leading-normal text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {m.bundle!.summary.summaryNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </details>
          </section>

          <section className="mb-7" aria-labelledby="pl-trends-heading">
            <h3 id="pl-trends-heading" className={cn("mb-1", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {PILOT_FEEDBACK_VOCABULARY.feedbackByAreaHeading}
            </h3>
            <p className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>
              {PILOT_FEEDBACK_VOCABULARY.feedbackByAreaLead}
            </p>
            {m.bundle!.trends.trends.length === 0 ? (
              <p className={cn(OPERATOR_TYPOGRAPHY.helper)} role="status">
                No feedback rows for this time range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={productLearningTableClass}>
                  <thead>
                    <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                      <th className={productLearningThTdClass}>Review area</th>
                      <th className={productLearningNumericCellClass}>Trusted</th>
                      <th className={productLearningNumericCellClass}>Revised</th>
                      <th className={productLearningNumericCellClass}>Rejected</th>
                      <th className={productLearningNumericCellClass}>Follow-up</th>
                      <th className={productLearningNumericCellClass}>Reviews</th>
                      <th className={productLearningThTdClass}>Repeated theme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.bundle!.trends.trends.map((row) => (
                      <tr key={row.trendKey}>
                        <td className={productLearningThTdClass}>
                          <div>{row.artifactTypeOrHint || "—"}</div>
                          {row.windowLabel ? (
                            <div className={OPERATOR_TYPOGRAPHY.helper}>{row.windowLabel}</div>
                          ) : null}
                        </td>
                        <td className={productLearningNumericCellClass}>{row.acceptedOrTrustedCount}</td>
                        <td className={productLearningNumericCellClass}>{row.revisionCount}</td>
                        <td className={productLearningNumericCellClass}>{row.rejectionCount}</td>
                        <td className={productLearningNumericCellClass}>{row.needsFollowUpCount}</td>
                        <td className={productLearningNumericCellClass}>{row.distinctRunCount}</td>
                        <td className={cn(productLearningThTdClass, OPERATOR_TYPOGRAPHY.body)}>
                          {row.repeatedThemeIndicator ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mb-7" aria-labelledby="pl-opps-heading">
            <h3 id="pl-opps-heading" className={cn("mb-1", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {PILOT_FEEDBACK_VOCABULARY.topImprovementOpportunitiesHeading}
            </h3>
            <p className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>
              Ranked candidates for product review (not auto-filed work items).
            </p>
            {m.bundle!.opportunities.opportunities.length === 0 ? (
              <p className={cn(OPERATOR_TYPOGRAPHY.helper)} role="status">
                No improvement opportunities matched the current thresholds.
              </p>
            ) : (
              <ol className="pl-5 text-neutral-700 dark:text-neutral-300 leading-normal">
                {m.bundle!.opportunities.opportunities.map((o) => (
                  <li key={o.opportunityId} className="mb-3.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <strong>{o.title}</strong>
                      <SeverityTag severity={o.severity} />
                      <span className={OPERATOR_TYPOGRAPHY.helper}>
                        {o.affectedArtifactTypeOrWorkflowArea} · {o.evidenceSignalCount} feedback item(s) ·{" "}
                        {o.distinctRunCount} review(s)
                      </span>
                    </div>
                    <p className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>{o.summary}</p>
                    {o.repeatedThemeSnippet ? (
                      <p className={cn("mt-1.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                        <em>Repeated theme:</em> {o.repeatedThemeSnippet}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <PlanningBridgePanel since={sinceIsoForRange(m.range)} disabled={m.loading} />

          <section className="mb-6" aria-labelledby="pl-triage-heading">
            <h3 id="pl-triage-heading" className={cn("mb-1", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {PILOT_FEEDBACK_VOCABULARY.itemsNeedingReviewHeading}
            </h3>
            <p className={cn("mt-0", OPERATOR_TYPOGRAPHY.helper)}>
              {PILOT_FEEDBACK_VOCABULARY.itemsNeedingReviewLead}
            </p>
            {m.bundle!.triage.items.length === 0 ? (
              <p className={cn(OPERATOR_TYPOGRAPHY.helper)} role="status">
                No items need review for this scope and time range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={productLearningTableClass}>
                  <thead>
                    <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                      <th className={productLearningNumericCellClass}>#</th>
                      <th className={productLearningThTdClass}>Title</th>
                      <th className={productLearningThTdClass}>Severity</th>
                      <th className={productLearningThTdClass}>Area</th>
                      <th className={productLearningThTdClass}>Detail</th>
                      <th className={productLearningThTdClass}>Suggested next step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.bundle!.triage.items.map((item) => (
                      <tr key={item.queueItemId}>
                        <td className={productLearningNumericCellClass}>{item.priorityRank}</td>
                        <td className={productLearningThTdClass}>{item.title}</td>
                        <td className={productLearningThTdClass}>
                          <SeverityTag severity={item.severity} />
                        </td>
                        <td className={productLearningThTdClass}>{item.affectedArtifactTypeOrWorkflowArea}</td>
                        <td className={cn(productLearningThTdClass, OPERATOR_TYPOGRAPHY.body, "max-w-[280px]")}>{item.detailSummary}</td>
                        <td className={cn(productLearningThTdClass, OPERATOR_TYPOGRAPHY.body)}>{item.suggestedNextAction ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className={cn(OPERATOR_TYPOGRAPHY.micro, "text-neutral-400 dark:text-neutral-500")}>
            Panel timestamps may differ slightly between calls; use <strong>Refresh</strong> after changing time range to
            reload all sections together.
          </p>
        </>
      ) : null}
    </div>
  );
}
