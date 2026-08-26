"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompositeAlertRulesPickReviewBeforeCombiningStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before combining composite alert rules without a scoped review. */
export function CompositeAlertRulesPickReviewBeforeCombiningStrip(
  props: CompositeAlertRulesPickReviewBeforeCombiningStripProps,
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
      aria-labelledby="composite-alert-rules-pick-review-before-combining-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="composite-alert-rules-pick-review-before-combining-strip"
    >
      <h2
        id="composite-alert-rules-pick-review-before-combining-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before combining rules
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Composite rules are easiest to validate against one review package. Choose one to keep metric previews aligned.
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
          fieldId="composite-alert-rules-pick-review-before-combining"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
