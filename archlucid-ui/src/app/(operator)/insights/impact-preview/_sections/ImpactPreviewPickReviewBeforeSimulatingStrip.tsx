"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ImpactPreviewPickReviewBeforeSimulatingStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before impact preview simulation is scoped to a review package. */
export function ImpactPreviewPickReviewBeforeSimulatingStrip(
  props: ImpactPreviewPickReviewBeforeSimulatingStripProps,
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
      aria-labelledby="impact-preview-pick-review-before-simulating-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="impact-preview-pick-review-before-simulating-strip"
    >
      <h2
        id="impact-preview-pick-review-before-simulating-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before simulating
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Impact preview compares proposed changes against a finalized review. Choose one to keep simulation results
        tied to governance context.
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
          fieldId="impact-preview-pick-review-before-simulating"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
