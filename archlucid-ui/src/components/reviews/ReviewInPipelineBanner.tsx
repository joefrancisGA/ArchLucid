"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useReviewPipelineElapsedWaitCopy } from "@/hooks/use-review-pipeline-elapsed-wait-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";
import { resolveCurrentPipelineStageLabel } from "@/lib/resolve-active-pipeline-stage";
import {
  REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL,
  REVIEW_PIPELINE_WORKING_BACKGROUND_HEADLINE,
  REVIEW_PIPELINE_WORKING_BACKGROUND_HELPER,
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
  const { isWorkingMode } = useWorkspaceMode();

  if (!shouldShowReviewInPipelineBanner(props.initialSummary, props.diagnosticContext)) {
    return null;
  }

  const buyerLabelsActive = isBuyerVocabularyPassActive();
  const stageLabel = resolveCurrentPipelineStageLabel([], props.initialSummary, buyerLabelsActive);
  const waitDetail = useReviewPipelineElapsedWaitCopy(stageLabel, !isWorkingMode);
  const executionMode = props.initialSummary?.structuralExecutionMode ?? null;
  const safetyMessage =
    !isWorkingMode && shouldShowReviewPipelineBackgroundSafety(executionMode)
      ? resolveReviewPipelineBackgroundSafetyMessage(executionMode)
      : null;
  const headline = isWorkingMode
    ? REVIEW_PIPELINE_WORKING_BACKGROUND_HEADLINE
    : buyerLabelsActive
      ? "Assessment in progress"
      : "Analysis in progress";

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
            <span className="font-semibold">{headline}</span>
            {stageLabel.trim().length > 0 ? (
              <>
                {": "}
                {stageLabel}
              </>
            ) : null}
          </p>
        </div>
        {isWorkingMode ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="review-in-pipeline-working-background-helper"
          >
            {REVIEW_PIPELINE_WORKING_BACKGROUND_HELPER}
          </p>
        ) : null}
        {safetyMessage !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{safetyMessage}</p>
        ) : null}
        {waitDetail !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-in-pipeline-wait-detail">
            {waitDetail}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {isWorkingMode ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="review-in-pipeline-open-in-flight-strip"
            onClick={() => {
              requestOpenShellInFlightOperations();
            }}
          >
            {REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="review-in-pipeline-banner-activity-cta"
          onClick={() => navigateTab("activity")}
        >
          {REVIEW_IN_PIPELINE_BANNER_ACTIVITY_CTA_LABEL}
        </Button>
      </div>
    </div>
  );
}
