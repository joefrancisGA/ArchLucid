import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import {
  COMPARE_INSUFFICIENT_FINALIZED_COMPACT,
  COMPARE_ZERO_FINALIZED_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";

export type CompareInsufficientFinalizedEmptyStateProps = {
  readonly finalizedCount: number;
};

/** Compare page when fewer than two finalized review packages exist in the workspace. */
export function CompareInsufficientFinalizedEmptyState(props: CompareInsufficientFinalizedEmptyStateProps) {
  const { finalizedCount } = props;
  const preset = finalizedCount === 0 ? COMPARE_ZERO_FINALIZED_COMPACT : COMPARE_INSUFFICIENT_FINALIZED_COMPACT;

  return (
    <EnterpriseCompactEmptyState
      {...preset}
      footer={<SeedSampleReviewButton />}
    />
  );
}
