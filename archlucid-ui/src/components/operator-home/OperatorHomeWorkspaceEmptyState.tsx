import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** First-run workspace with no review packages — compact enterprise empty pattern plus demo seed. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      {...OPERATOR_HOME_REVIEWS_EMPTY_COMPACT}
      footer={<SeedSampleReviewButton label="Load sample workspace" />}
    />
  );
}
