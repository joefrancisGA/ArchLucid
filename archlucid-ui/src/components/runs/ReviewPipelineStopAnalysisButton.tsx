"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  REVIEW_PIPELINE_STOP_ANALYSIS_CTA,
  REVIEW_PIPELINE_STOP_ANALYSIS_HELP,
  REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA,
  requestReviewPipelineStopAnalysis,
} from "@/lib/operations/review-pipeline-stop-analysis";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

  const handleStop = useCallback(async () => {
    if (stopping || cancelRequested) {
      return;
    }

    setStopping(true);

    try {
      await requestReviewPipelineStopAnalysis(runId);
      setCancelRequested(true);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Try again in a moment.";
      showError("Could not stop this analysis", detail);
    } finally {
      setStopping(false);
    }
  }, [cancelRequested, runId, stopping]);

  const label = stopping || cancelRequested ? REVIEW_PIPELINE_STOP_ANALYSIS_IN_FLIGHT_CTA : REVIEW_PIPELINE_STOP_ANALYSIS_CTA;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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
  );
}
