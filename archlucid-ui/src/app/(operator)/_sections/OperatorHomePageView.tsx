"use client";

import Link from "next/link";

import { OperatorHomeDeferredOnboarding } from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { OperatorHomeContinueLastReviewPackageSection } from "@/components/operator-home/OperatorHomeContinueLastReviewPackageSection";
import { OperatorHomeInFlightReviewsSection } from "@/components/operator-home/OperatorHomeInFlightReviewsSection";
import { UnfinishedWorkRail } from "@/components/operator-home/UnfinishedWorkRail";
import { OperatorHomeWorkspaceMetricsStrip } from "@/components/operator-home/OperatorHomeWorkspaceMetricsStrip";
import { OperatorHomeCompactStartingActionsSection } from "@/components/operator-home/OperatorHomeCompactStartingActionsSection";
import { OperatorAttentionKindStrip } from "@/components/operator/OperatorAttentionKindStrip";
import {
  OperatorHomeRunsPanel,
} from "@/components/operator-home/OperatorHomeDeferredPanels";
import { WorkspaceModeGuidedWorkingOfferHost } from "@/components/workspace-mode/WorkspaceModeGuidedWorkingOfferHost";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorHomeBuyerChrome } from "@/components/operator-home/OperatorHomeBuyerChrome";
import {
  OPERATOR_LAYOUT,
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LINK,
} from "@/lib/design-tokens";
import { BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA } from "@/lib/buyer/buyer-polish-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import { deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns } from "@/lib/resolve-operator-home-workspace-phase";
import { OperatorHomeRefreshProvider } from "@/lib/operator/operator-home-refresh-context";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";
import {
  composeOperatorHomeSections,
  type OperatorHomeSectionDescriptor,
  type OperatorHomeSectionId,
} from "@/lib/compose-operator-home-sections";
import {
  BuyerPolishedHomeHeroSectionDeferred,
  DevTestingQuickSwitchPanelDeferred,
  OperatorHomeBelowFoldPanelsDeferred,
  OperatorHomeSponsorRoiStripDeferred,
  OperatorHomeGateDeferred,
  OperatorHomeStickinessCockpitDeferred,
  PilotCommandCenterCardDeferred,
} from "./operator-home-page-view-deferred-chunks";
import { OperatorHomePageHeader } from "./OperatorHomePageHeader";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  OPERATOR_HOME_PRIMARY_CONTENT_ID,
  OPERATOR_HOME_SKIP_LINK_LABEL,
} from "./operator-home-page-surface-copy";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";
import { operatorHomePageSubtitle } from "@/lib/operator/operator-home-page-copy";
import { cn } from "@/lib/utils";

type OperatorHomePageViewProps = {
  model: OperatorHomePageViewModel;
};

function HomeSectionHeading(props: { readonly id?: string; readonly children: string }) {
  return (
    <h2 id={props.id} className={OPERATOR_HOME_SECTION_HEADING}>
      {props.children}
    </h2>
  );
}

function OperatorHomePageChrome(props: {
  readonly buyerPolishedShell: boolean;
  readonly workingMode: boolean;
}): React.JSX.Element {
  return (
    <>
      <OperatorHomePageHeader
        subtitle={operatorHomePageSubtitle(props.buyerPolishedShell, props.workingMode) ?? ""}
      />
</>
  );
}

function HomeRecentReviewsSection(props: { readonly model: OperatorHomePageViewModel }) {
  const openAllReviewsHref = `/architecture/reviews?projectId=${encodeURIComponent(props.model.runsDashboard.projectId)}`;

  return (
    <section
      aria-labelledby="operator-home-reviews-heading"
      className={OPERATOR_LAYOUT.sectionHeadingStack}
      data-testid="operator-home-recent-reviews"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <Link
          href={openAllReviewsHref}
          className={cn("inline-block shrink-0 font-semibold", OPERATOR_LINK.nav)}
          data-testid="runs-dashboard-open-all-reviews"
        >
          {BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA}
        </Link>
      </div>
      {/* Outcome line renders inside the runs panel from live list rows (avoids empty vs sample mismatch). */}
      <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
    </section>
  );
}

type RenderOperatorHomeSectionInput = {
  readonly section: OperatorHomeSectionDescriptor;
  readonly model: OperatorHomePageViewModel;
  readonly buyerPolishedShell: boolean;
  readonly workspaceMetrics: ReturnType<typeof deriveOperatorHomeWorkspaceMetrics>;
  readonly workingMode: boolean;
};

function renderOperatorHomeSection(input: RenderOperatorHomeSectionInput): React.JSX.Element | null {
  switch (input.section.id) {
    case "metrics-strip":
      return (
        <div key={input.section.id} data-testid={input.section.testId}>
          <OperatorHomeWorkspaceMetricsStrip
            runsDashboard={input.model.runsDashboard}
            workingMode={input.workingMode}
          />
        </div>
      );

    case "attention-taxonomy":
      return (
        <div key={input.section.id} data-testid={input.section.testId}>
          <OperatorAttentionKindStrip
            variant="compact"
            suppressKinds={
              input.section.suppressAttentionKinds !== undefined
                ? input.section.suppressAttentionKinds
                : undefined
            }
          />
        </div>
      );

    case "start-something":
      return (
        <div key={input.section.id} data-testid={input.section.testId}>
          <OperatorHomeCompactStartingActionsSection
            hasCommittedManifest={input.workspaceMetrics.reviewPackagesCommitted > 0}
            hasActiveDeskWork={input.workspaceMetrics.reviewPackagesActive > 0}
            workingMode={input.workingMode}
          />
        </div>
      );

    case "in-flight":
      return (
        <div key={input.section.id} data-testid={input.section.testId} className={OPERATOR_LAYOUT.sectionStack}>
          {input.workingMode ? (
            <OperatorHomeContinueLastReviewPackageSection runs={input.model.runsDashboard.items} />
          ) : null}
          <OperatorHomeInFlightReviewsSection />
        </div>
      );

    case "unfinished":
      return (
        <div key={input.section.id} data-testid={input.section.testId}>
          <UnfinishedWorkRail runs={input.model.runsDashboard.items} />
        </div>
      );

    case "hero":
      return (
        <BuyerPolishedHomeHeroSectionDeferred
          key={input.section.id}
          runsDashboard={input.model.runsDashboard}
        />
      );

    case "command-center":
      return (
        <section
          key={input.section.id}
          aria-label="Overview command center"
          data-testid={input.section.testId}
        >
          <PilotCommandCenterCardDeferred
            openFindingsCount={input.workspaceMetrics.openFindings}
            governanceWarningsCount={input.workspaceMetrics.governanceWarnings}
            hasWorkspaceReviews={input.workspaceMetrics.hasReviews}
            runsDashboard={input.model.runsDashboard}
            suppressLeadCopy
            showContextualHelp={false}
          />
        </section>
      );

    case "recent-reviews":
      return <HomeRecentReviewsSection key={input.section.id} model={input.model} />;

    case "buyer-chrome":
      return <OperatorHomeBuyerChrome key={input.section.id} />;

    case "below-fold":
      return (
        <OperatorHomeBelowFoldPanelsDeferred
          key={input.section.id}
          buyerPolishedShell={input.buyerPolishedShell}
          model={input.model}
          showFirstValueCallout={!input.buyerPolishedShell}
        />
      );

    case "stickiness":
      return <OperatorHomeStickinessCockpitDeferred key={input.section.id} />;

    case "sponsor-roi":
      return <OperatorHomeSponsorRoiStripDeferred key={input.section.id} />;

    default: {
      const unreachable: never = input.section.id as never;
      throw new Error(`Unhandled operator home section ${unreachable}.`);
    }
  }
}

function OperatorHomePageBody(props: {
  readonly model: OperatorHomePageViewModel;
  readonly buyerPolishedShell: boolean;
  readonly workingMode: boolean;
}): React.JSX.Element {
  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    props.model.runsDashboard.items,
    props.model.runsDashboard.totalCount,
  );
  const overviewPhaseSignals = deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns(
    props.model.runsDashboard.items,
    props.model.runsDashboard.totalCount,
  );
  const sections = composeOperatorHomeSections({
    phaseSignals: {
      hasWorkspaceReviews: workspaceMetrics.hasReviews,
      hasOverviewReviewRows: overviewPhaseSignals.hasOverviewReviewRows,
      draftCount: 0,
      hasCommittedManifest: workspaceMetrics.reviewPackagesCommitted > 0,
      openFindingsCount: workspaceMetrics.openFindings,
      governanceWarningsCount: workspaceMetrics.governanceWarnings,
    },
    buyerPolishedShell: props.buyerPolishedShell,
    metrics: workspaceMetrics,
    workingMode: props.workingMode,
  });

  return (
    <OperatorHomeWorkspaceActivityProvider
      initialHasReviews={workspaceMetrics.hasReviews}
      initialHasOverviewReviewRows={overviewPhaseSignals.hasOverviewReviewRows}
      initialOpenFindingsCount={workspaceMetrics.openFindings}
    >
      <WorkspaceModeGuidedWorkingOfferHost />
      {sections.map((section) =>
        renderOperatorHomeSection({
          section,
          model: props.model,
          buyerPolishedShell: props.buyerPolishedShell,
          workspaceMetrics,
          workingMode: props.workingMode,
        }),
      )}
      <DevTestingQuickSwitchPanelDeferred />
    </OperatorHomeWorkspaceActivityProvider>
  );
}

/** Landing page: hero CTA, workspace activity, and collapsed advanced guidance. */
export function OperatorHomePageView({ model }: OperatorHomePageViewProps) {
  const evalChromeShell = useProductionEvalChrome();
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <OperatorHomeGateDeferred>
      <OperatorHomeRefreshProvider>
        {isWorkingMode ? null : <OperatorHomeDeferredOnboarding />}
        {evalChromeShell ? (
          <a
            href={`#${OPERATOR_HOME_PRIMARY_CONTENT_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {OPERATOR_HOME_SKIP_LINK_LABEL}
          </a>
        ) : null}
        <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.majorSectionGap}>
          <OperatorHomePageChrome buyerPolishedShell={evalChromeShell} workingMode={isWorkingMode} />
          {evalChromeShell ? (
            <div
              id={OPERATOR_HOME_PRIMARY_CONTENT_ID}
              className="scroll-mt-24 space-y-4"
              data-testid="operator-home-primary-content"
            >
              <OperatorHomePageBody model={model} buyerPolishedShell={evalChromeShell} workingMode={isWorkingMode} />
            </div>
          ) : (
            <OperatorHomePageBody model={model} buyerPolishedShell={evalChromeShell} workingMode={isWorkingMode} />
          )}
        </OperatorPageContainer>
      </OperatorHomeRefreshProvider>
    </OperatorHomeGateDeferred>
  );
}

export { renderOperatorHomeSection, type OperatorHomeSectionId };
