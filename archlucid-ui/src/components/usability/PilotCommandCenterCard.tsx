"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeCanonicalNextActionSlot } from "@/components/operator-home/OperatorHomeCanonicalNextActionSlot";
import { InviteeFirstOrientationPanel } from "@/components/operator/InviteeFirstOrientationPanel";
import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import { FirstPilotOperateUnlockVocabularyRail } from "@/components/FirstPilotOperateUnlockVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useOperatorHomeEmptyDoThisNextAction } from "@/hooks/use-operator-home-empty-do-this-next-action";
import {
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_DRAFT_ARCHITECTURE_EYEBROW,
} from "@/lib/buyer/buyer-polish-copy";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import {
  toOperatorCanonicalNextActionFromEmptyHome,
  toOperatorCanonicalNextActionFromPilot,
} from "@/lib/operator-canonical-next-action";
import { resolvePilotNextBestAction, type PilotNextBestAction } from "@/lib/resolve-pilot-next-best-action";
import { resolveLiveRunsDashboardModel } from "@/lib/operator/operator-home-live-runs-dashboard";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import {
  resolveOperatorHomeLifecycleEmphasizedPath,
  resolveLatestArchitectureDraftHref,
  resolveOperatorHomePhaseHeroCopy,
  deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns,
  resolveOperatorHomeWorkspacePhase,
} from "@/lib/resolve-operator-home-workspace-phase";
import { formatRunHomeListUpdatedLabel } from "@/lib/operator/operator-home-run-list-insight";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  buildGoldenSponsorPackageWalkthroughHref,
} from "@/lib/golden-sponsor-package-walkthrough";
import { resolveInviteeHomeOrientationCopy } from "@/lib/invitee-first-orientation";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
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
  /** SSR/live signal that the runs dashboard lists at least one active row (including showcase). */
  readonly hasOverviewReviewRows?: boolean;
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
  const liveRunsSnapshot = workspaceActivity.liveRunsSnapshot ?? null;
  const runsDashboard = useMemo(() => {
    if (props.runsDashboard === undefined) {
      return undefined;
    }

    return resolveLiveRunsDashboardModel(props.runsDashboard, liveRunsSnapshot);
  }, [liveRunsSnapshot, props.runsDashboard]);
  const workspaceMetrics = useMemo(() => {
    if (runsDashboard === undefined) {
      return null;
    }

    return deriveOperatorHomeWorkspaceMetrics(runsDashboard.items, runsDashboard.totalCount);
  }, [runsDashboard]);
  // SSR seed props are a stale floor once live rows arrive: keeping them would pin counts that
  // Refresh just proved lower (a resolved finding, a deleted review).
  const useSsrSeedCounts = liveRunsSnapshot === null;
  const openFindingsCount = Math.max(
    useSsrSeedCounts ? props.openFindingsCount ?? 0 : 0,
    workspaceActivity.openFindingsCount,
    workspaceMetrics?.openFindings ?? 0,
  );
  const governanceWarningsCount = Math.max(
    useSsrSeedCounts ? props.governanceWarningsCount ?? 0 : 0,
    workspaceMetrics?.governanceWarnings ?? 0,
  );
  const hasWorkspaceReviews =
    (useSsrSeedCounts && props.hasWorkspaceReviews === true) || workspaceActivity.hasWorkspaceReviews;
  const overviewRunsSignals = useMemo(() => {
    if (runsDashboard === undefined) {
      return null;
    }

    return deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns(
      runsDashboard.items,
      runsDashboard.totalCount,
    );
  }, [runsDashboard]);
  const hasOverviewReviewRows =
    (useSsrSeedCounts &&
      (props.hasOverviewReviewRows === true || props.hasWorkspaceReviews === true)) ||
    workspaceActivity.hasOverviewReviewRows ||
    overviewRunsSignals?.hasOverviewReviewRows === true;
  const commitQuery = useCorePilotCommitContextQuery({
    seedRunItems: runsDashboard?.items,
  });
  const setupReadiness = useFinishSetupReadinessContext();
  const emptyNext = useOperatorHomeEmptyDoThisNextAction();

  const phaseSignals = useMemo(
    () => ({
      hasWorkspaceReviews,
      hasOverviewReviewRows,
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
      hasOverviewReviewRows,
      hasWorkspaceReviews,
      openFindingsCount,
    ],
  );

  const workspacePhase = resolveOperatorHomeWorkspacePhase(phaseSignals);
  const latestDraft = draftEntries[0] ?? null;
  const latestDraftPrimary = resolveOperatorHomeLatestDraftPrimaryAction(latestDraft);
  const resumeHref = latestDraftPrimary?.href ?? null;
  const resumeCtaLabel = latestDraftPrimary?.ctaLabel ?? "Resume latest draft";
  const heroCopy = resolveOperatorHomePhaseHeroCopy(
    workspacePhase,
    phaseSignals,
    latestDraft?.displayName ?? null,
    latestDraft,
  );
  const emphasizedPath = resolveOperatorHomeLifecycleEmphasizedPath(workspacePhase, latestDraft);
  const draftLastEditedLabel =
    latestDraft?.lastUpdatedUtc !== undefined && latestDraft.lastUpdatedUtc.trim().length > 0
      ? formatRunHomeListUpdatedLabel({
          runId: latestDraft.architectureId,
          projectId: "default",
          createdUtc: latestDraft.lastUpdatedUtc,
        })
      : null;
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
    runsDashboard !== undefined &&
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
          <div className="min-w-0 space-y-1">
            {showLeadCopy && workspacePhase !== "eval-with-drafts" ? (
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
            {workspacePhase === "eval-with-drafts" ? (
              <>
                <p
                  className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}
                  data-testid="operator-home-draft-hero-labels"
                >
                  {draftLastEditedLabel !== null
                    ? `${OPERATOR_HOME_DRAFT_ARCHITECTURE_EYEBROW} — ${draftLastEditedLabel}`
                    : OPERATOR_HOME_DRAFT_ARCHITECTURE_EYEBROW}
                </p>
                <p
                  className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
                  data-testid="operator-home-resume-draft-bridge"
                >
                  {heroCopy.lead}
                </p>
              </>
            ) : null}
          </div>
          {workspacePhase === "eval-with-drafts" && resumeHref !== null ? (
            <Button asChild variant="primary" size="sm" className={cn(heroCtaButtonClass, "shrink-0")}>
              <Link href={resumeHref} data-testid="operator-home-resume-draft-primary">
                {resumeCtaLabel}
              </Link>
            </Button>
          ) : null}
          {showContextualHelp ? (
            <div className="shrink-0" data-testid="pilot-command-center-help">
              <PageContextualHelpButton />
            </div>
          ) : null}
        </div>
        {workspacePhase === "eval-empty" ? (
          <FirstPilotOperateUnlockVocabularyRail currentSurfaceId="first-pilot" />
        ) : null}
      </div>

      {showHeroKpiStrip && runsDashboard !== undefined ? (
        <OperatorHomeWorkspaceMetricsSummary
          runsDashboard={runsDashboard}
          setupReadyCount={setupReadiness.readyCount}
          setupTotalCount={setupReadiness.totalCount}
          setupReadinessLoading={setupReadiness.phase === "loading"}
          variant="hero-inline"
        />
      ) : null}

      {workspacePhase === "eval-empty" ? (
        <div className={cn("space-y-4", OPERATOR_LAYOUT.inlineGap)}>
          {isInviteeReviewer ? (
            <InviteeFirstOrientationPanel copy={resolveInviteeHomeOrientationCopy()} />
          ) : null}
          <OperatorHomeCanonicalNextActionSlot
            clientFallback={toOperatorCanonicalNextActionFromEmptyHome(emptyNext.action)}
            sampleLoading={emptyNext.sampleLoading}
            slotTestId="operator-home-do-this-next"
            bridgeTestId="operator-home-do-this-next-bridge"
            primaryTestId="operator-home-do-this-next-primary"
          />
        </div>
      ) : null}

      {workspacePhase === "eval-with-drafts" ? (
        <OperatorHomeDualPathCards
          emphasizedPath={emphasizedPath}
          pagePrimaryOwnedElsewhere={resumeHref !== null}
        />
      ) : null}

      {workspacePhase === "active-reviews" ? (
        <OperatorHomeDualPathCards emphasizedPath={emphasizedPath} />
      ) : null}

      {workspacePhase === "operational" ? (
        <OperatorHomeCanonicalNextActionSlot
          clientFallback={toOperatorCanonicalNextActionFromPilot(nextAction)}
          bridgeTestId="pilot-command-center-lead"
          primaryTestId="pilot-next-best-action"
        />
      ) : null}
    </section>
  );
}

