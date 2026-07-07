"use client";

import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_EXPLORE_SAMPLE_LEAD,
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import { cn } from "@/lib/utils";

const runSampleReviewHref = reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID);

/** Consolidated sample workspace entry — two actions only, hidden after first commit. */
export function OperatorHomeExploreSampleSection(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-explore-sample-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "border border-neutral-200 shadow-sm dark:border-neutral-800")}
      data-testid="operator-home-explore-sample-section"
    >
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <OperatorHomeCardSectionTitle id="operator-home-explore-sample-heading">
          {OPERATOR_HOME_EXPLORE_SAMPLE_HEADING}
        </OperatorHomeCardSectionTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {OPERATOR_HOME_EXPLORE_SAMPLE_LEAD}
        </p>
      </div>
      <div className={cn("mt-4 flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link
            href={showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId)}
            data-testid="operator-home-explore-open-completed-sample"
          >
            {OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href={runSampleReviewHref} data-testid="operator-home-explore-run-sample-review">
            {OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
          </Link>
        </Button>
      </div>
    </section>
  );
}
