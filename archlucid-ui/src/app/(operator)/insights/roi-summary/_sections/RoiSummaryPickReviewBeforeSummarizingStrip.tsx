"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

export type RoiSummaryPickReviewBeforeSummarizingStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before ROI summary is treated as scoped to a review. */
export function RoiSummaryPickReviewBeforeSummarizingStrip(
  props: RoiSummaryPickReviewBeforeSummarizingStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = workspaceRun.runId.trim();
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
      aria-labelledby="roi-summary-pick-review-before-summarizing-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="roi-summary-pick-review-before-summarizing-strip"
    >
      <h2
        id="roi-summary-pick-review-before-summarizing-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before summarizing ROI
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        ROI figures are easiest to interpret against a finalized {REVIEW_PACKAGE_LABEL.toLowerCase()}. Choose one to keep sponsor context
        aligned.
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
          label={REVIEW_PACKAGE_LABEL}
          fieldId="roi-summary-pick-review-before-summarizing"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
