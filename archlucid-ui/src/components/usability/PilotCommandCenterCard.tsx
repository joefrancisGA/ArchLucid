"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { Button } from "@/components/ui/button";
import { PilotPathPreviewStepper } from "@/components/usability/PilotPathPreviewStepper";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
  PILOT_PATH_PREVIEW_STEPS,
  resolveOperatorHomeHeroHeading,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { resolvePilotNextBestAction, type PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

const heroCtaButtonClass = "h-8";

const DEFAULT_NEXT_ACTION: PilotNextBestAction = {
  label: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
  bridgeCopy: PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
};

/**
 * Single next-action command center for operator Overview — compact hero with one state-aware primary CTA.
 */
export function PilotCommandCenterCard(): React.JSX.Element {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const heroHeading = resolveOperatorHomeHeroHeading(hasCommittedArchitectureReview);
  const commitQuery = useCorePilotCommitContextQuery();

  const nextAction = useMemo((): PilotNextBestAction => {
    if (commitQuery.isPending || commitQuery.isError || commitQuery.data === undefined) {
      return DEFAULT_NEXT_ACTION;
    }

    return resolvePilotNextBestAction(commitQuery.data, hasCommittedArchitectureReview);
  }, [commitQuery.isPending, commitQuery.isError, commitQuery.data, hasCommittedArchitectureReview]);

  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "heroCard")}
      data-testid="pilot-command-center-card"
    >
      <div className="heroHeader flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <OperatorHomeCardSectionTitle id="pilot-command-center-heading">
            {heroHeading}
          </OperatorHomeCardSectionTitle>
          <p
            className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
            data-testid="pilot-command-center-lead"
          >
            {nextAction.bridgeCopy}
          </p>
        </div>

        <div
          className={cn("heroActions flex shrink-0 flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}
          data-testid="pilot-command-center-cta-row"
        >
          <Button asChild variant="primary" size="sm" className={heroCtaButtonClass}>
            <Link href={nextAction.href} data-testid="pilot-next-best-action">
              {nextAction.label}
            </Link>
          </Button>
          {!hasCommittedArchitectureReview ? (
            nextAction.href === showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId) ? (
              <Button asChild variant="outline" size="sm" className={heroCtaButtonClass}>
                <Link href="/reviews/new" data-testid="pilot-command-center-start-own-review">
                  {PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK}
                </Link>
              </Button>
            ) : null
          ) : null}
        </div>
      </div>

      {!hasCommittedArchitectureReview ? (
        <PilotPathPreviewStepper steps={PILOT_PATH_PREVIEW_STEPS} className="heroSteps mt-2" />
      ) : null}
    </section>
  );
}
