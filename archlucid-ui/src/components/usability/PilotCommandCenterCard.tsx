"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeDoThisNextCard } from "@/components/operator-home/OperatorHomeDoThisNextCard";
import { GoldenSponsorPackageWalkthroughPanel } from "@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughPanel";
import { InviteeFirstOrientationPanel } from "@/components/operator/InviteeFirstOrientationPanel";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeResumeDraftCallout } from "@/components/operator-home/OperatorHomeResumeDraftCallout";
import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import { FirstPilotOperateUnlockVocabularyRail } from "@/components/FirstPilotOperateUnlockVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { resolvePilotNextBestAction, type PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";
import {
  resolveOperatorHomeLifecycleEmphasizedPath,
  resolveOperatorHomePhaseHeroCopy,
  resolveOperatorHomeWorkspacePhase,
} from "@/lib/resolve-operator-home-workspace-phase";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  buildGoldenSponsorPackageWalkthroughHref,
} from "@/lib/golden-sponsor-package-walkthrough";
import { resolveInviteeHomeOrientationCopy } from "@/lib/invitee-first-orientation";
import { useInviteeReviewerContext } from "@/hooks/use-invitee-reviewer-context";

const heroCtaButtonClass = "h-8";

const DEFAULT_NEXT_ACTION: PilotNextBestAction = {
  label: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  href: buildGoldenSponsorPackageWalkthroughHref(),
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
  /** SSR runs dashboard model — enables hero KPI strip for populated workspaces. */
  readonly runsDashboard?: OperatorHomeRunsDashboardModel;
};

/**
 * Overview command center — phase-aware hero (eval → drafts → active reviews → operational).
 */
export function PilotCommandCenterCard(props: PilotCommandCenterCardProps = {}): React.JSX.Element {
  const cardTestId = props.embedded === true ? "pilot-command-center-card-embedded" : "pilot-command-center-card";
  const { isInviteeReviewer } = useInviteeReviewerContext();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const workspaceActivity = useOperatorHomeWorkspaceActivity();
  const draftEntries = useArchitectureDraftRegistryEntries();
  const workspaceMetrics = useMemo(() => {
    if (props.runsDashboard === undefined) {
      return null;
    }

    return deriveOperatorHomeWorkspaceMetrics(props.runsDashboard.items, props.runsDashboard.totalCount);
  }, [props.runsDashboard]);
  const openFindingsCount = Math.max(
    props.openFindingsCount ?? 0,
    workspaceActivity.openFindingsCount,
    workspaceMetrics?.openFindings ?? 0,
  );
  const governanceWarningsCount = Math.max(
    props.governanceWarningsCount ?? 0,
    workspaceMetrics?.governanceWarnings ?? 0,
  );
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

  const showHeroKpiStrip =
    props.runsDashboard !== undefined &&
    (workspacePhase === "active-reviews" || workspacePhase === "operational");

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
        <FirstPilotOperateUnlockVocabularyRail currentSurfaceId="first-pilot" />
      </div>

      {showHeroKpiStrip && props.runsDashboard !== undefined ? (
        <OperatorHomeWorkspaceMetricsSummary
          runsDashboard={props.runsDashboard}
          setupReadyCount={0}
          setupTotalCount={0}
          setupReadinessLoading={false}
          variant="hero-inline"
        />
      ) : null}

      {workspacePhase === "eval-empty" ? (
        <div className={cn("space-y-4", OPERATOR_LAYOUT.inlineGap)}>
          {isInviteeReviewer ? (
            <InviteeFirstOrientationPanel copy={resolveInviteeHomeOrientationCopy()} />
          ) : (
            <GoldenSponsorPackageWalkthroughPanel />
          )}
          <OperatorHomeDoThisNextCard />
        </div>
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

