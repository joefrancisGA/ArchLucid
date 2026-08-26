"use client";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AdvisorySchedulesPickReviewBeforeSchedulingStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before advisory scan schedules are scoped to a review. */
export function AdvisorySchedulesPickReviewBeforeSchedulingStrip(
  props: AdvisorySchedulesPickReviewBeforeSchedulingStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = (workspaceRun?.activeRunId ?? "").trim();
  const pickerValue =
    props.selectedReviewId.trim().length > 0
      ? props.selectedReviewId
      : workspaceRunId.length > 0
        ? workspaceRunId
        : "";

  return (
    <section
      aria-labelledby="advisory-schedules-pick-review-before-scheduling-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="advisory-schedules-pick-review-before-scheduling-strip"
    >
      <h2
        id="advisory-schedules-pick-review-before-scheduling-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before scheduling
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Recurring advisory scans are easiest to schedule against a finalized review package. Choose one to
        keep schedule context aligned.
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
          fieldId="advisory-schedules-pick-review-before-scheduling"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
