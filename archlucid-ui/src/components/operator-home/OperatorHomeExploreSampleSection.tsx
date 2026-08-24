"use client";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useSampleReviewsOnOverviewVisible } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { GoldenSponsorPackageWalkthroughPanel } from "@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughPanel";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  OPERATOR_HOME_CREATION_EXAMPLE_BODY,
  OPERATOR_HOME_CREATION_EXAMPLE_TITLE,
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_EXPLORE_SAMPLE_LEAD,
  OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_BODY,
  OPERATOR_HOME_GUIDED_REVIEW_EXAMPLE_TITLE,
  OPERATOR_HOME_LEARNING_RESOURCES_HEADING,
  OPERATOR_HOME_LEARNING_RESOURCES_LEAD,
  OPERATOR_HOME_OPEN_CREATION_EXAMPLE_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator/operator-home-example-request";
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
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { hasWorkspaceReviews, recentRunIds } = useOperatorHomeWorkspaceActivity();

  if (!sampleReviewsVisible) {
    return null;
  }

  // When Recent reviews already shows a sample or tenant row, do not solicit more demos (Azure Portal bar).
  if (hasCommittedArchitectureReview || recentRunIds.length > 0) {
    return null;
  }

  const reducedProminence = hasWorkspaceReviews;
  const sectionHeading = reducedProminence
    ? OPERATOR_HOME_LEARNING_RESOURCES_HEADING
    : OPERATOR_HOME_EXPLORE_SAMPLE_HEADING;
  const sectionLead = reducedProminence
    ? OPERATOR_HOME_LEARNING_RESOURCES_LEAD
    : OPERATOR_HOME_EXPLORE_SAMPLE_LEAD;

  return (
    <section
      aria-labelledby="operator-home-explore-sample-heading"
      className={cn(
        OPERATOR_LAYOUT.sectionHeadingStack,
        reducedProminence
          ? OPERATOR_CARD.learningResourcesSurface
          : "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
      )}
      data-testid="operator-home-explore-sample-section"
      data-prominence={reducedProminence ? "secondary" : "primary"}
    >
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <OperatorHomeCardSectionTitle id="operator-home-explore-sample-heading">
          {sectionHeading}
        </OperatorHomeCardSectionTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {sectionLead}
        </p>
      </div>
      {!reducedProminence ? (
        <GoldenSponsorPackageWalkthroughPanel compact />
      ) : (
        <div className={cn("grid gap-3 sm:grid-cols-2", "mt-3", OPERATOR_LAYOUT.inlineGap)}>
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
      )}
    </section>
  );
}
