import type {
  EnterpriseCompactEmptyStateAction,
  EnterpriseCompactEmptyStateProps,
} from "@/components/EnterpriseCompactEmptyState";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  IMPACT_PREVIEW_EMPTY_NO_BASELINE_BODY,
  IMPACT_PREVIEW_EMPTY_NO_BASELINE_TITLE,
} from "@/lib/impact-preview-page-copy";
import {
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  buildReviewScorecardSampleHref,
} from "@/lib/review-scorecard-empty-state";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type InsightsFinalizedReviewJobId =
  | "compare"
  | "ask"
  | "scorecard"
  | "impact-preview"
  | "evidence-graph";

export const INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO =
  "No finalized reviews yet" as const;

export const INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION = {
  label: "Open reviews",
  href: "/architecture/reviews",
  variant: "primary" as const,
};

export const INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION = {
  label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  href: "/architecture/reviews/new",
  variant: "outline" as const,
};

const INSIGHTS_JOB_DESCRIPTIONS: Record<InsightsFinalizedReviewJobId, string> = {
  compare:
    "You need at least two finalized reviews before ArchLucid can compare changes over time.",
  ask: "Finalize a review package before asking questions across workspace evidence.",
  scorecard: REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  "impact-preview": IMPACT_PREVIEW_EMPTY_NO_BASELINE_BODY,
  "evidence-graph":
    "Select a finalized review package to explore evidence links, or start a review to build the graph.",
};

const INSIGHTS_JOB_TEST_IDS: Record<InsightsFinalizedReviewJobId, string> = {
  compare: "compare-zero-finalized-empty-state",
  ask: "ask-no-review-empty-state",
  scorecard: "review-scorecard-empty-state",
  "impact-preview": "impact-preview-no-baseline-empty-state",
  "evidence-graph": "evidence-graph-finalized-prerequisite-empty-state",
};

export type BuildInsightsFinalizedReviewPrerequisiteEmptyInput = {
  readonly jobId: InsightsFinalizedReviewJobId;
  readonly finalizedCount?: number;
  readonly includeSampleAction?: boolean;
};

/** Shared Insights prerequisite empty when no finalized review packages exist (TB-2389). */
export function buildInsightsFinalizedReviewPrerequisiteEmpty(
  input: BuildInsightsFinalizedReviewPrerequisiteEmptyInput,
): EnterpriseCompactEmptyStateProps {
  const finalizedCount = input.finalizedCount ?? 0;
  const actions: EnterpriseCompactEmptyStateAction[] = [
    INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION,
    INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION,
  ];

  if (input.includeSampleAction === true) {
    actions.push({
      label: "View sample scorecard",
      href: buildReviewScorecardSampleHref(),
      variant: "outline",
    });
  }

  if (input.jobId === "ask") {
    actions.push({
      label: "Load sample workspace",
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline",
    });
  }

  const title =
    input.jobId === "impact-preview"
      ? IMPACT_PREVIEW_EMPTY_NO_BASELINE_TITLE
      : input.jobId === "scorecard"
        ? REVIEW_SCORECARD_EMPTY_HEADING
        : INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO;

  return {
    testId: INSIGHTS_JOB_TEST_IDS[input.jobId],
    title,
    description: INSIGHTS_JOB_DESCRIPTIONS[input.jobId],
    actions,
  };
}

/** Compare when exactly one finalized review exists — still needs a second package. */
export function buildCompareInsufficientFinalizedEmpty(): EnterpriseCompactEmptyStateProps {
  return {
    testId: "compare-insufficient-finalized-empty-state",
    title: "One finalized review available",
    description: "Finalize one more review to compare changes over time.",
    actions: [
      INSIGHTS_FINALIZED_REVIEW_OPEN_REVIEWS_ACTION,
      { ...INSIGHTS_FINALIZED_REVIEW_START_REVIEW_ACTION, variant: "outline" },
    ],
  };
}
