"use client";

import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AuditPickReviewBeforeSearchStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Review picker shown before audit trail search runs. */
export function AuditPickReviewBeforeSearchStrip(
  props: AuditPickReviewBeforeSearchStripProps,
): React.JSX.Element {
  const workspaceRun = useWorkspaceActiveRun();
  const workspaceRunId = workspaceRun?.activeRunId?.trim() ?? "";
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
      aria-labelledby="audit-pick-review-before-search-heading"
      className="mb-4 rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="audit-pick-review-before-search-strip"
    >
      <h2
        id="audit-pick-review-before-search-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a review before searching the audit trail
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Audit events are scoped to a review package. Choose one to filter governance activity.
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
          committedOnly={false}
          preferAutoPick={false}
          autoSelectSyntheticSample={false}
          label="Review package"
          fieldId="audit-pick-review-before-search"
          hideFieldHelper
        />
      </div>
    </section>
  );
}
