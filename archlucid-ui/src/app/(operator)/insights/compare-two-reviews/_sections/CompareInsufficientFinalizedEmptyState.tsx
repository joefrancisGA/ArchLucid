"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import {
  buildCompareInsufficientFinalizedEmpty,
  buildInsightsFinalizedReviewPrerequisiteEmpty,
} from "@/lib/insights-finalized-review-prerequisite-empty";
import { ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE } from "@/lib/architecture/compare-delta-counts-two-sealed-footnote-copy";
import { ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE } from "@/lib/architecture/compare-second-sealed-review-honesty-copy";
import { CompareRunPickersPartialInventoryFootnote } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersPartialInventoryFootnote";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareInsufficientFinalizedEmptyStateProps = {
  readonly finalizedCount: number;
  readonly onLoadSampleComparison?: () => void;
};

/** Compare page when fewer than two finalized reviews exist in the workspace. */
export function CompareInsufficientFinalizedEmptyState(props: CompareInsufficientFinalizedEmptyStateProps) {
  const { finalizedCount, onLoadSampleComparison } = props;
  const { isWorkingMode } = useWorkspaceMode();
  const preset =
    finalizedCount === 0
      ? buildInsightsFinalizedReviewPrerequisiteEmpty({
          jobId: "compare",
          finalizedCount: 0,
          workingMode: isWorkingMode,
        })
      : buildCompareInsufficientFinalizedEmpty(isWorkingMode);

  return (
    <EnterpriseCompactEmptyState
      {...preset}
      footer={
        <div className="space-y-3">
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="compare-insufficient-finalized-second-sealed-discipline"
          >
            {ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE}
          </p>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="compare-insufficient-finalized-counts-two-sealed"
          >
            {ARCHITECTURE_COMPARE_DELTA_COUNTS_TWO_SEALED_FOOTNOTE}
          </p>
          <CompareRunPickersPartialInventoryFootnote />
          <CompareSampleComparisonAction onLoadSampleComparison={onLoadSampleComparison} />
        </div>
      }
    />
  );
}
