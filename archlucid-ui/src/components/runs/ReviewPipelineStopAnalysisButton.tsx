"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { awaitMinimumVisibleDuration } from "@/lib/await-minimum-visible-duration";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_PIPELINE_STOP_ANALYSIS_CTA,
  REVIEW_PIPELINE_STOP_ANALYSIS_HELP,
  REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA,
  REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_DETAIL,
  REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_HEADLINE,
  requestReviewPipelineStopAnalysis,
} from "@/lib/operations/review-pipeline-stop-analysis";
import { cn } from "@/lib/utils";

export type ReviewPipelineStopAnalysisButtonProps = {
  readonly runId: string;
  readonly className?: string;
  readonly disabled?: boolean;
};

/**
 * Cooperative cancel on the progress surfaces the reader is already watching.
 * Mirrors the shell in-flight popover without making them hunt the header.
 */
export function ReviewPipelineStopAnalysisButton({
  runId,
  className,
  disabled = false,
}: ReviewPipelineStopAnalysisButtonProps): React.JSX.Element {
  const [stopping, setStopping] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [stopErrorMessage, setStopErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCancelRequested(false);
    setStopErrorMessage(null);
  }, [runId]);

  const handleStop = useCallback(async () => {
    if (stopping || cancelRequested) {
      return;
    }

    const startedAtMs = Date.now();

    setStopping(true);
    setStopErrorMessage(null);

    try {
      await requestReviewPipelineStopAnalysis(runId);
      await awaitMinimumVisibleDuration(startedAtMs);
      setCancelRequested(true);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Try again in a moment.";
      setStopErrorMessage(`Could not stop this analysis. ${detail}`);
    } finally {
      setStopping(false);
    }
  }, [cancelRequested, runId, stopping]);

  const label = stopping || cancelRequested ? REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA : REVIEW_PIPELINE_STOP_ANALYSIS_CTA;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={disabled || stopping || cancelRequested}
          data-testid="review-pipeline-stop-analysis"
          onClick={() => {
            void handleStop();
          }}
        >
          {label}
        </Button>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {REVIEW_PIPELINE_STOP_ANALYSIS_HELP}
        </span>
      </div>
      {stopErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={stopErrorMessage}
          testId="review-pipeline-stop-analysis-inline-error"
        />
      ) : null}
      {cancelRequested ? (
        <div
          className={cn(DESIGN_TOKENS.callout.info, "p-3")}
          data-testid="review-pipeline-stop-analysis-outcome"
          role="status"
          aria-live="polite"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_HEADLINE}
          </p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEW_PIPELINE_STOP_ANALYSIS_REQUESTED_DETAIL}
          </p>
        </div>
      ) : null}
    </div>
  );
}
