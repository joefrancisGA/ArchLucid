"use client";

import { cn } from "@/lib/utils";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countArchitectureDraftsReadyForReview } from "@/lib/architecture/architecture-draft-ready-for-review";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

import {
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_SUMMARY_COMMITTED_LABEL,
  REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
  REVIEWS_HUB_SUMMARY_EMPTY_HINT,
  REVIEWS_HUB_SUMMARY_FINDINGS_LABEL,
  REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL,
  REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL,
  REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL,
} from "./reviews-hub-copy";
import type { ReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type ReviewsHubSummaryRowProps = {
  readonly summary: ReviewsWorkspaceSummary;
};

const REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID = "reviews-hub-resume-drafts";

type SummaryMetricProps = {
  readonly label: string;
  readonly value: number;
  readonly onClick?: () => void;
  readonly testId?: string;
};

function SummaryMetric(props: SummaryMetricProps): React.JSX.Element {
  const valueLabel = `${finiteIntegerCountDisplay(props.value)} ${props.label}`;
  const content = (
    <>
      <span className="font-semibold tabular-nums text-al-text-primary">{finiteIntegerCountDisplay(props.value)}</span>{" "}
      <span>{props.label}</span>
    </>
  );

  if (props.onClick !== undefined) {
    return (
      <button
        type="button"
        className={cn(
          "m-0 inline-flex items-baseline gap-1 border-0 bg-transparent p-0 text-al-text-secondary hover:text-al-text-primary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        onClick={props.onClick}
        data-testid={props.testId}
        aria-label={`${valueLabel}. Scroll to ${REVIEWS_HUB_RESUME_DRAFTS_TITLE.toLowerCase()}.`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      {content}
    </span>
  );
}

function scrollToReadyForReviewSection(): void {
  document.getElementById(REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** Compact workspace posture row on `/architecture/reviews` — always shown, including zeros. */
export function ReviewsHubSummaryRow(props: ReviewsHubSummaryRowProps): React.JSX.Element {
  const { summary } = props;
  const draftEntries = useArchitectureDraftRegistryEntries();
  const draftsReady = countArchitectureDraftsReadyForReview(draftEntries);
  const reviewMetricsAllZero =
    summary.inProgress === 0
    && summary.committed === 0
    && summary.findings === 0
    && summary.openRisks === 0
    && summary.readyForGovernance === 0;

  const metrics: SummaryMetricProps[] = [
    { label: REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL, value: summary.inProgress },
    { label: REVIEWS_HUB_SUMMARY_COMMITTED_LABEL, value: summary.committed },
    { label: REVIEWS_HUB_SUMMARY_FINDINGS_LABEL, value: summary.findings },
    { label: REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL, value: summary.openRisks },
    { label: REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL, value: summary.readyForGovernance },
    {
      label: REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
      value: draftsReady,
      onClick: draftsReady > 0 ? scrollToReadyForReviewSection : undefined,
      testId: "reviews-hub-summary-ready-for-review",
    },
  ];

  return (
    <section className="space-y-2" data-testid="reviews-hub-summary-row" aria-label="Workspace review summary">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="inline-flex items-center gap-3">
            {index > 0 ? (
              <span aria-hidden className="hidden text-al-text-secondary sm:inline">
                |
              </span>
            ) : null}
            <SummaryMetric {...metric} />
          </div>
        ))}
      </div>
      {reviewMetricsAllZero ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-hub-summary-empty-hint">
          {REVIEWS_HUB_SUMMARY_EMPTY_HINT}
        </p>
      ) : null}
    </section>
  );
}

export { REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID };
