"use client";

import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import {
  OPERATOR_HOME_CREATION_EXAMPLE_BODY,
  OPERATOR_HOME_CREATION_EXAMPLE_TITLE,
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_EXPLORE_SAMPLE_LEAD,
  OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY,
  OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_TITLE,
  OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";
import {
  OPERATOR_HOME_OPENING_CREATION_EXAMPLE_LABEL,
  OPERATOR_HOME_RUNNING_GUIDED_REVIEW_LABEL,
} from "@/lib/review-start-progress-copy";
import {
  SHOWCASE_SAMPLE_CREATED_REGISTRY,
  showcaseSampleCreatedPackageHref,
} from "@/lib/showcase-sample-created-registry";
import { cn } from "@/lib/utils";

const runSampleReviewHref = reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID);
const creationExampleHref = showcaseSampleCreatedPackageHref(SHOWCASE_SAMPLE_CREATED_REGISTRY.runId);

/** Secondary examples below workspace activity — distinct from the hero completed-review path. */
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
      <div className={cn("mt-4 grid gap-3 sm:grid-cols-2", OPERATOR_LAYOUT.inlineGap)}>
        <article className="flex flex-col gap-2" aria-labelledby="operator-home-creation-example-title">
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)} id="operator-home-creation-example-title">
            {OPERATOR_HOME_CREATION_EXAMPLE_TITLE}
          </h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            {OPERATOR_HOME_CREATION_EXAMPLE_BODY}
          </p>
          <OperatorHomeNavigateLoadingButton
            variant="outline"
            size="sm"
            className="h-8 w-fit"
            href={creationExampleHref}
            idleLabel={OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA}
            loadingLabel={OPERATOR_HOME_OPENING_CREATION_EXAMPLE_LABEL}
            data-testid="operator-home-explore-open-created-sample"
          />
        </article>
        <article className="flex flex-col gap-2" aria-labelledby="operator-home-guided-review-example-title">
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)} id="operator-home-guided-review-example-title">
            {OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_TITLE}
          </h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            {OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY}
          </p>
          <OperatorHomeNavigateLoadingButton
            variant="outline"
            size="sm"
            className="h-8 w-fit"
            href={runSampleReviewHref}
            idleLabel={OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
            loadingLabel={OPERATOR_HOME_RUNNING_GUIDED_REVIEW_LABEL}
            data-testid="operator-home-explore-run-sample-review"
          />
        </article>
      </div>
    </section>
  );
}
