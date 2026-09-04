"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import {
  buildCompareInsufficientFinalizedEmpty,
  buildInsightsFinalizedReviewPrerequisiteEmpty,
} from "@/lib/insights-finalized-review-prerequisite-empty";

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
      footer={<CompareSampleComparisonAction onLoadSampleComparison={onLoadSampleComparison} />}
    />
  );
}
