"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countArchitectureDraftsReadyForReview } from "@/lib/architecture/architecture-draft-ready-for-review";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  reviewsHubAwaitingApprovalPresentation,
  reviewsHubCommittedPresentation,
  reviewsHubInProgressPresentation,
  reviewsHubOpenFindingsPresentation,
  reviewsHubOpenRisksPresentation,
} from "@/lib/reviews-hub-summary-presentations";

import {
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
  REVIEWS_HUB_SUMMARY_EMPTY_COUNTS_HINT,
  REVIEWS_HUB_SUMMARY_EMPTY_HINT,
} from "./reviews-hub-copy";
import {
  resolveReviewsHubHeaderPrimary,
  shouldShowReviewsHubResumeDrafts,
} from "./reviews-hub-header-primary";
import type { ReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type ReviewsHubSummaryRowProps = {
  readonly summary: ReviewsWorkspaceSummary;
};

const REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID = "reviews-hub-resume-drafts";

type SummaryMetricProps = {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
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

  if (props.href !== undefined && props.href.length > 0) {
    return (
      <Link
        href={props.href}
        className={cn(
          "m-0 inline-flex items-baseline gap-1",
          OPERATOR_LINK.inline,
          OPERATOR_TYPOGRAPHY.helper,
          "text-al-text-secondary hover:text-al-text-primary",
        )}
        data-testid={props.testId}
        aria-label={`${valueLabel}. Open ${props.label}.`}
      >
        {content}
      </Link>
    );
  }

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

function renderMetricSeparator(index: number): React.JSX.Element | null {
  if (index === 0) {
    return null;
  }

  return (
    <span aria-hidden className="hidden text-al-text-secondary sm:inline">
      |
    </span>
  );
}

/** Compact workspace posture row on `/architecture/reviews` — emphasizes non-zero counts. */
export function ReviewsHubSummaryRow(props: ReviewsHubSummaryRowProps): React.JSX.Element {
  const { summary } = props;
  const draftEntries = useArchitectureDraftRegistryEntries();
  const draftsReady = countArchitectureDraftsReadyForReview(draftEntries);
  const draftPrimary = resolveReviewsHubHeaderPrimary(draftEntries);
  const attentionMetricsAllZero =
    summary.findings === 0 && summary.openRisks === 0 && summary.readyForGovernance === 0;

  type SummaryEntry =
    | { readonly kind: "self-describing"; readonly testId: string; readonly presentation: ReturnType<typeof reviewsHubInProgressPresentation> }
    | { readonly kind: "drafts"; readonly metric: SummaryMetricProps };

  const metrics: SummaryEntry[] = [];

  if (summary.inProgress > 0) {
    metrics.push({
      kind: "self-describing",
      testId: "reviews-hub-summary-in-progress",
      presentation: reviewsHubInProgressPresentation(summary.inProgress),
    });
  }

  if (summary.committed > 0) {
    metrics.push({
      kind: "self-describing",
      testId: "reviews-hub-summary-committed",
      presentation: reviewsHubCommittedPresentation(summary.committed),
    });
  }

  if (summary.findings > 0) {
    metrics.push({
      kind: "self-describing",
      testId: "reviews-hub-summary-findings",
      presentation: reviewsHubOpenFindingsPresentation(summary.findings),
    });
  }

  if (summary.openRisks > 0) {
    metrics.push({
      kind: "self-describing",
      testId: "reviews-hub-summary-open-risks",
      presentation: reviewsHubOpenRisksPresentation(summary.openRisks),
    });
  }

  if (summary.readyForGovernance > 0) {
    metrics.push({
      kind: "self-describing",
      testId: "reviews-hub-summary-awaiting-approval",
      presentation: reviewsHubAwaitingApprovalPresentation(summary.readyForGovernance),
    });
  }

  metrics.push({
    kind: "drafts",
    metric: {
      label: REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
      value: draftsReady,
      href:
        draftsReady === 1 && draftPrimary.continuesSingleDraft
          ? draftPrimary.href
          : undefined,
      onClick:
        draftsReady > 0 && shouldShowReviewsHubResumeDrafts(draftEntries.length)
          ? scrollToReadyForReviewSection
          : undefined,
      testId: "reviews-hub-summary-ready-for-review",
    },
  });

  const showAttentionHint = attentionMetricsAllZero && summary.inProgress > 0;
  const showCountsHint = summary.inProgress === 0 && draftsReady === 0;

  return (
    <section className="space-y-1" data-testid="reviews-hub-summary-row" aria-label="Workspace review summary">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {metrics.map((entry, index) => (
          <div
            key={entry.kind === "drafts" ? entry.metric.label : entry.testId}
            className="inline-flex items-center gap-3"
          >
            {renderMetricSeparator(index)}
            {entry.kind === "self-describing" ? (
              <SelfDescribingMetricCount
                variant="inline"
                presentation={entry.presentation}
                testId={entry.testId}
              />
            ) : (
              <SummaryMetric {...entry.metric} />
            )}
          </div>
        ))}
      </div>
      {showAttentionHint ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-hub-summary-empty-hint">
          {REVIEWS_HUB_SUMMARY_EMPTY_HINT}
        </p>
      ) : null}
      {showCountsHint ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-hub-summary-empty-hint">
          {REVIEWS_HUB_SUMMARY_EMPTY_COUNTS_HINT}
        </p>
      ) : null}
    </section>
  );
}

export { REVIEWS_HUB_RESUME_DRAFTS_SECTION_ID };
