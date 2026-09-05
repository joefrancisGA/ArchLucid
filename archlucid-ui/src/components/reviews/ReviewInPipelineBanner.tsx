"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useReviewPipelineElapsedWaitCopy } from "@/hooks/use-review-pipeline-elapsed-wait-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { resolveCurrentPipelineStageLabel } from "@/lib/resolve-active-pipeline-stage";
import {
  resolveReviewPipelineBackgroundSafetyMessage,
  shouldShowReviewPipelineBackgroundSafety,
} from "@/lib/review-execution-background-safety-copy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import { shouldShowReviewInPipelineBanner } from "@/lib/reviews/should-show-review-in-pipeline-banner";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

import { useReviewDetailTabNavigation } from "./ReviewDetailWorkspace";

export const REVIEW_IN_PIPELINE_BANNER_ACTIVITY_CTA_LABEL = "View activity";

export type ReviewInPipelineBannerProps = {
  readonly runId: string;
  readonly initialSummary: RunSummary | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
};

/** TB-2385: compact in-pipeline honesty on non-activity review tabs. */
export function ReviewInPipelineBanner(props: ReviewInPipelineBannerProps): ReactElement | null {
  const navigateTab = useReviewDetailTabNavigation();

  if (!shouldShowReviewInPipelineBanner(props.initialSummary, props.diagnosticContext)) {
    return null;
  }

  const buyerLabelsActive = isBuyerVocabularyPassActive();
  const stageLabel = resolveCurrentPipelineStageLabel([], props.initialSummary, buyerLabelsActive);
  const waitDetail = useReviewPipelineElapsedWaitCopy(stageLabel, true);
  const executionMode = props.initialSummary?.structuralExecutionMode ?? null;
  const safetyMessage =
    shouldShowReviewPipelineBackgroundSafety(executionMode)
      ? resolveReviewPipelineBackgroundSafetyMessage(executionMode)
      : null;

  return (
    <div
      className={cn(
        DESIGN_TOKENS.callout.info,
        "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
      )}
      data-testid="review-in-pipeline-banner"
      role="status"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind="in-progress" label="In progress" data-testid="review-in-pipeline-status-tag" />
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold">
              {buyerLabelsActive ? "Assessment in progress" : "Analysis in progress"}:
            </span>{" "}
            {stageLabel}
          </p>
        </div>
        {safetyMessage !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{safetyMessage}</p>
        ) : null}
        {waitDetail !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-in-pipeline-wait-detail">
            {waitDetail}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        data-testid="review-in-pipeline-banner-activity-cta"
        onClick={() => navigateTab("activity")}
      >
        {REVIEW_IN_PIPELINE_BANNER_ACTIVITY_CTA_LABEL}
      </Button>
    </div>
  );
}
