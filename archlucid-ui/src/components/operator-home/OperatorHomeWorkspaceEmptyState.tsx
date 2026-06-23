import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { RunDemoReviewButton } from "@/components/RunDemoReviewButton";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { BUYER_SEED_SAMPLE_WORKSPACE_CTA } from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** First-run workspace with no review packages — compact enterprise empty pattern plus demo paths. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      {...OPERATOR_HOME_REVIEWS_EMPTY_COMPACT}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <RunDemoReviewButton />
          <SeedSampleReviewButton label={BUYER_SEED_SAMPLE_WORKSPACE_CTA} />
        </div>
      }
    />
  );
}
