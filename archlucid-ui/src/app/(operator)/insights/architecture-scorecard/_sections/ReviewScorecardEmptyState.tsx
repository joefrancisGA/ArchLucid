import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_SCORECARD_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE } from "@/lib/review-scorecard-empty-state";

import { ReviewScorecardEmptyStatePreview } from "./ReviewScorecardEmptyStatePreview";

/** Sponsor-ready empty state for the operator review scorecard. */
export function ReviewScorecardEmptyState(): React.JSX.Element {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack}>
      <EnterpriseCompactEmptyState {...REVIEW_SCORECARD_EMPTY_COMPACT} />
      <ReviewScorecardEmptyStatePreview />
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE}
      </p>
    </div>
  );
}
