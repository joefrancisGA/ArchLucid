import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Explains the buyer review workflow stepper vs in-page review section tabs. */
export function ReviewDetailWorkspaceOrientation(): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="review-detail-workspace-orientation"
      role="note"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Review workflow</span>{" "}
        (step strip above) walks finalized deliverables — sponsor report, finalized review record, evidence trail,
        governance, and audit — for sponsors and auditors.
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">Review sections</span> below are where
        you work through findings, evidence, decisions, and exports for this review.
      </p>
    </div>
  );
}
