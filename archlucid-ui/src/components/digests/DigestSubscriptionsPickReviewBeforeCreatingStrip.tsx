"use client";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DigestSubscriptionsPickReviewBeforeCreatingStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before creating digest subscriptions without scoped review context. */
export function DigestSubscriptionsPickReviewBeforeCreatingStrip(
  props: DigestSubscriptionsPickReviewBeforeCreatingStripProps,
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
      aria-labelledby="digest-subscriptions-pick-review-before-creating-heading"
      className="mb-4 rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="digest-subscriptions-pick-review-before-creating-strip"
    >
      <h2
        id="digest-subscriptions-pick-review-before-creating-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before creating subscriptions
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Subscription destinations are easiest to validate against a finalized review package. Choose one
        before adding delivery routes.
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
          fieldId="digest-subscriptions-pick-review-before-creating"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
