"use client";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { SampleReviewAhaMomentPanel } from "@/components/operator-home/SampleReviewAhaMomentPanel";
import {
  BUYER_HOME_PRIMARY_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";
import { SHOWCASE_HOME_AHA_MOMENT, showcasePrimaryFindingHref } from "@/lib/showcase-home-aha-moment";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

/**
 * First-run sample finding preview — one aha moment before opening the full review (TB-353 / assessment #2).
 */
export function OperatorHomeSampleReviewPreview(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <div
      className={cn(OPERATOR_LAYOUT.sectionStack, OPERATOR_CARD.nested)}
      data-testid="operator-home-sample-review-preview"
    >
      <SampleReviewAhaMomentPanel
        moment={SHOWCASE_HOME_AHA_MOMENT}
        findingHref={showcasePrimaryFindingHref(SHOWCASE_STATIC_DEMO_RUN_ID)}
        ctaLabel={BUYER_HOME_PRIMARY_CTA}
        ctaTestId="operator-home-sample-review-open"
        heading={OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
        lead={OPERATOR_HOME_SAMPLE_FINDINGS_LEAD}
        demoLabel={undefined}
      />
    </div>
  );
}
