"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AlertTuningPickReviewBeforeTuningStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before alert threshold tuning without a scoped review. */
export function AlertTuningPickReviewBeforeTuningStrip(
  props: AlertTuningPickReviewBeforeTuningStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = (workspaceRun?.activeRunId ?? "").trim();
  const pickerValue =
    props.selectedReviewId.trim().length > 0
      ? props.selectedReviewId
      : workspaceRunId.length > 0
        ? workspaceRunId
        : "";

  useEffect(() => {
    if (props.selectedReviewId.trim().length > 0) {
      return;
    }

    if (workspaceRunId.length > 0) {
      props.onSelectReview(workspaceRunId);
    }
  }, [props.onSelectReview, props.selectedReviewId, workspaceRunId]);

  return (
    <section
      aria-labelledby="alert-tuning-pick-review-before-tuning-heading"
      className="mb-4 rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="alert-tuning-pick-review-before-tuning-strip"
    >
      <h2
        id="alert-tuning-pick-review-before-tuning-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before tuning
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Threshold recommendations are easiest to interpret against a finalized review package.
      </p>
      <div className="mt-3 min-w-[16rem] max-w-xl">
        <AskRunIdPicker
          value={pickerValue}
          onChange={(value) => {
            if (value.trim().length > 0) {
              props.onSelectReview(value.trim());
            }
          }}
          selectedThreadId=""
          committedOnly
          preferAutoPick={false}
          autoSelectSyntheticSample={false}
          label="Review package"
          fieldId="alert-tuning-pick-review-before-tuning"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
