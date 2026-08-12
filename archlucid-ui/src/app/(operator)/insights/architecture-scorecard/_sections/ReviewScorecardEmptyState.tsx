import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/EmptyState";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_PRIMARY_HREF,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_SECONDARY_HREF,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  buildReviewScorecardSampleHref,
} from "@/lib/review-scorecard-empty-state";

import { ReviewScorecardEmptyStatePreview } from "./ReviewScorecardEmptyStatePreview";

/** Executive-ready empty state for the operator review scorecard. */
export function ReviewScorecardEmptyState(): React.JSX.Element {
  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="review-scorecard-empty-state">
      <EmptyState
        title={REVIEW_SCORECARD_EMPTY_HEADING}
        description={REVIEW_SCORECARD_EMPTY_DESCRIPTION}
        actions={[
          { label: REVIEW_SCORECARD_EMPTY_PRIMARY_CTA, href: REVIEW_SCORECARD_EMPTY_PRIMARY_HREF },
          {
            label: REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
            href: buildReviewScorecardSampleHref(),
            variant: "outline",
          },
        ]}
        secondaryAction={{
          label: REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
          href: REVIEW_SCORECARD_EMPTY_SECONDARY_HREF,
        }}
      />
      <ReviewScorecardEmptyStatePreview />
      <p className={cn("m-0 text-center text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE}
      </p>
    </div>
  );
}
