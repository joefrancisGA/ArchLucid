"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import { cn } from "@/lib/utils";

export type ScorecardReviewPickerStripProps = {
  readonly selectedReviewId: string | null;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Compact review picker before scorecard metrics render. */
export function ScorecardReviewPickerStrip(props: ScorecardReviewPickerStripProps): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = workspaceRun.runId.trim();
  const pickerValue = props.selectedReviewId ?? (workspaceRunId.length > 0 ? workspaceRunId : "");

  useEffect(() => {
    if (props.selectedReviewId !== null) {
      return;
    }

    if (workspaceRunId.length > 0) {
      props.onSelectReview(workspaceRunId);
    }
  }, [props.onSelectReview, props.selectedReviewId, workspaceRunId]);

  return (
    <section
      aria-labelledby="scorecard-review-picker-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="scorecard-review-picker-strip"
    >
      <h2
        id="scorecard-review-picker-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Scorecard metrics are scoped to an {REVIEW_PACKAGE_LABEL.toLowerCase()}. Workspace active review is the default when available.
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
          fieldId="scorecard-review-picker"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
