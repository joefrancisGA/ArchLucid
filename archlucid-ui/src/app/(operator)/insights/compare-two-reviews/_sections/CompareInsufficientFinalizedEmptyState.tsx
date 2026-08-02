import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CompareSampleComparisonAction } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction";
import {
  COMPARE_INSUFFICIENT_FINALIZED_COMPACT,
  COMPARE_ZERO_FINALIZED_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";

export type CompareInsufficientFinalizedEmptyStateProps = {
  readonly finalizedCount: number;
  readonly onLoadSampleComparison?: () => void;
};

/** Compare page when fewer than two finalized reviews exist in the workspace. */
export function CompareInsufficientFinalizedEmptyState(props: CompareInsufficientFinalizedEmptyStateProps) {
  const { finalizedCount, onLoadSampleComparison } = props;
  const preset = finalizedCount === 0 ? COMPARE_ZERO_FINALIZED_COMPACT : COMPARE_INSUFFICIENT_FINALIZED_COMPACT;

  return (
    <EnterpriseCompactEmptyState
      {...preset}
      footer={<CompareSampleComparisonAction onLoadSampleComparison={onLoadSampleComparison} />}
    />
  );
}
