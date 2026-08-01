"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeDoThisNextCard } from "@/components/operator-home/OperatorHomeDoThisNextCard";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeResumeDraftCallout } from "@/components/operator-home/OperatorHomeResumeDraftCallout";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { resolvePilotNextBestAction, type PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import {
  resolveOperatorHomeLifecycleEmphasizedPath,
  resolveOperatorHomePhaseHeroCopy,
  resolveOperatorHomeWorkspacePhase,
} from "@/lib/resolve-operator-home-workspace-phase";
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
  /** Governance warnings across workspace reviews — attention signal for populated workspaces. */
  readonly governanceWarningsCount?: number;
  /** SSR/live signal that the workspace already has review packages. */
  readonly hasWorkspaceReviews?: boolean;
  /** When the page header already carries the lead copy, omit the in-card tagline. */
  readonly suppressLeadCopy?: boolean;
  /** When the page header already exposes contextual help, omit the in-card help button. */
  readonly showContextualHelp?: boolean;
};

/**
 * Overview command center — phase-aware hero (eval → drafts → active reviews → operational).
 */
export function PilotCommandCenterCard(props: PilotCommandCenterCardProps = {}): React.JSX.Element {
  const cardTestId = props.embedded === true ? "pilot-command-center-card-embedded" : "pilot-command-center-card";
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const workspaceActivity = useOperatorHomeWorkspaceActivity();
  const draftEntries = useArchitectureDraftRegistryEntries();
  const openFindingsCount = Math.max(props.openFindingsCount ?? 0, workspaceActivity.openFindingsCount);
  const governanceWarningsCount = Math.max(props.governanceWarningsCount ?? 0, 0);
  const hasWorkspaceReviews =
    (props.hasWorkspaceReviews ?? false) || workspaceActivity.hasWorkspaceReviews;
  const commitQuery = useCorePilotCommitContextQuery();

  const phaseSignals = useMemo(
    () => ({
      hasWorkspaceReviews,
      draftCount: draftEntries.length,
      hasCommittedManifest:
        hasCommittedArchitectureReview || commitQuery.data?.hasCommittedManifest === true,
      openFindingsCount,
      governanceWarningsCount,
    }),
    [
      commitQuery.data?.hasCommittedManifest,
      draftEntries.length,
      governanceWarningsCount,
      hasCommittedArchitectureReview,
      hasWorkspaceReviews,
      openFindingsCount,
    ],
  );

  const workspacePhase = resolveOperatorHomeWorkspacePhase(phaseSignals);
  const heroCopy = resolveOperatorHomePhaseHeroCopy(workspacePhase, phaseSignals);
  const emphasizedPath = resolveOperatorHomeLifecycleEmphasizedPath(workspacePhase);
  const showLeadCopy = props.suppressLeadCopy !== true;
  const showContextualHelp = props.showContextualHelp !== false;

  const nextAction = useMemo((): PilotNextBestAction => {
    if (workspacePhase !== "operational") {
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
    workspacePhase,
  ]);

  return (
    <section
      aria-labelledby="pilot-command-center-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "heroCard space-y-4")}
      data-testid={cardTestId}
      data-workspace-phase={workspacePhase}
    >
      <div className="heroHeader space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            {showLeadCopy ? (
              <p
                className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
                data-testid="pilot-command-center-tagline"
              >
                {heroCopy.lead}
              </p>
            ) : null}
            <OperatorHomeCardSectionTitle id="pilot-command-center-heading">
              {heroCopy.heading}
            </OperatorHomeCardSectionTitle>
          </div>
          {showContextualHelp ? (
            <div className="shrink-0" data-testid="pilot-command-center-help">
              <PageContextualHelpButton />
            </div>
          ) : null}
        </div>
      </div>

      {workspacePhase === "eval-empty" ? (
        <OperatorHomeDoThisNextCard />
      ) : null}

      {workspacePhase === "eval-with-drafts" ? (
        <div className={cn("space-y-4", OPERATOR_LAYOUT.inlineGap)}>
          <OperatorHomeResumeDraftCallout draftEntries={draftEntries} />
          <OperatorHomeDualPathCards emphasizedPath={emphasizedPath} />
        </div>
      ) : null}

      {workspacePhase === "active-reviews" ? (
        <OperatorHomeDualPathCards emphasizedPath={emphasizedPath} />
      ) : null}

      {workspacePhase === "operational" ? (
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
      ) : null}
    </section>
  );
}
