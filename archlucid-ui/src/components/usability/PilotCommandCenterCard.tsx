"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeDoThisNextCard } from "@/components/operator-home/OperatorHomeDoThisNextCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
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
  label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  href: showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
  bridgeCopy: OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
};

type PilotCommandCenterCardProps = {
  /** Secondary/mirrored instances use a distinct test id so Playwright strict locators stay unambiguous. */
  readonly embedded?: boolean;
  /** Open findings across workspace reviews — gates Review open findings (TB-1036). */
  readonly openFindingsCount?: number;
  /** SSR/live signal that the workspace already has review packages. */
  readonly hasWorkspaceReviews?: boolean;
};

/**
 * Overview command center — empty home uses a single Do-this-next card (TB-1038);
 * populated workspaces keep lifecycle paths or the state-aware next-best CTA.
 */
export function PilotCommandCenterCard(props: PilotCommandCenterCardProps = {}): React.JSX.Element {
  const cardTestId = props.embedded === true ? "pilot-command-center-card-embedded" : "pilot-command-center-card";
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const workspaceActivity = useOperatorHomeWorkspaceActivity();
  // Merge SSR props with live RunsDashboard reports so the hero CTA refreshes after fetch.
  const openFindingsCount = Math.max(props.openFindingsCount ?? 0, workspaceActivity.openFindingsCount);
  const hasWorkspaceReviews =
    (props.hasWorkspaceReviews ?? false) || workspaceActivity.hasWorkspaceReviews;
  const isEmptyHome = !hasWorkspaceReviews;
  const heroHeading = hasCommittedArchitectureReview
    ? OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING
    : OPERATOR_HOME_INTENT_CHOOSER_HEADING;
  const commitQuery = useCorePilotCommitContextQuery();

  const nextAction = useMemo((): PilotNextBestAction => {
    if (!hasCommittedArchitectureReview) {
      return DEFAULT_NEXT_ACTION;
    }

    if (commitQuery.isPending || commitQuery.isError || commitQuery.data === undefined) {
      return DEFAULT_NEXT_ACTION;
    }

    return resolvePilotNextBestAction(commitQuery.data, hasCommittedArchitectureReview, {
      openFindingsCount,
      hasWorkspaceReviews,
    });
  }, [
    commitQuery.isPending,
    commitQuery.isError,
    commitQuery.data,
    hasCommittedArchitectureReview,
    hasWorkspaceReviews,
    openFindingsCount,
  ]);

  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "heroCard space-y-4")}
      data-testid={cardTestId}
    >
      <div className="heroHeader space-y-3">
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")} data-testid="pilot-command-center-tagline">
          {OPERATOR_HOME_COMMAND_CENTER_TAGLINE}
        </p>
        <OperatorHomeCardSectionTitle id="pilot-command-center-heading">
          {heroHeading}
        </OperatorHomeCardSectionTitle>
      </div>

      {isEmptyHome ? (
        <OperatorHomeDoThisNextCard />
      ) : !hasCommittedArchitectureReview ? (
        <OperatorHomeDualPathCards />
      ) : (
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", OPERATOR_LAYOUT.inlineGap)}>
          <p
            className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
            data-testid="pilot-command-center-lead"
          >
            {nextAction.bridgeCopy}
          </p>
          <Button asChild variant="primary" size="sm" className={cn(heroCtaButtonClass, "shrink-0")}>
            <Link href={nextAction.href} data-testid="pilot-next-best-action">
              {nextAction.label}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
