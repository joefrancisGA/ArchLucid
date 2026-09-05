import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { countFindingsByClassificationBand } from "@/lib/findings/review-detail-findings-classification-band";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailReviewPackageClassificationSummaryProps = {
  readonly findings: readonly QuickDecisionFinding[];
  readonly className?: string;
};

/** First-viewport decision-grade vs checklist counts on the stamp band (IS-06). */
export function RunDetailReviewPackageClassificationSummary(
  props: RunDetailReviewPackageClassificationSummaryProps,
): React.JSX.Element | null {
  const counts = countFindingsByClassificationBand(props.findings);
  const total = counts.decisionGrade + counts.checklist;

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        props.className,
      )}
      data-testid="run-detail-stamp-classification-summary"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Finding classification
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Decision-grade: {counts.decisionGrade} · Checklist: {counts.checklist}
      </p>
    </div>
  );
}
