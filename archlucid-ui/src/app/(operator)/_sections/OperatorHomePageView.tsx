"use client";

import { OperatorHomeDeferredOnboarding } from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { UnfinishedWorkRail } from "@/components/operator-home/UnfinishedWorkRail";
import {
  OperatorHomeRunsPanel,
} from "@/components/operator-home/OperatorHomeDeferredPanels";
import { OperatorHomeWorkspaceActivityProvider } from "@/components/operator-home/operator-home-workspace-activity-context";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import {
  OPERATOR_HOME_PRIMARY_SECTION_HEADING,
  OPERATOR_LAYOUT,
} from "@/lib/design-tokens";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import { OperatorHomeRefreshProvider } from "@/lib/operator/operator-home-refresh-context";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";
import {
  BuyerPolishedHomeHeroSectionDeferred,
  OperatorHomeBelowFoldPanelsDeferred,
  OperatorHomeExecutiveRoiStripDeferred,
  OperatorHomeGateDeferred,
  PilotCommandCenterCardDeferred,
} from "./operator-home-page-view-deferred-chunks";
import { OperatorHomePageHeader } from "./OperatorHomePageHeader";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";
import {
  operatorHomePageSubtitle,
} from "@/lib/operator/operator-home-page-copy";

type OperatorHomePageViewProps = {
  model: OperatorHomePageViewModel;
};

function HomeSectionHeading(props: { readonly id?: string; readonly children: string }) {
  return (
    <h2 id={props.id} className={OPERATOR_HOME_PRIMARY_SECTION_HEADING}>
      {props.children}
    </h2>
  );
}

function OperatorHomePageChrome(props: { readonly buyerPolishedShell: boolean }): React.JSX.Element {
  return (
    <>
      <OperatorHomePageHeader subtitle={operatorHomePageSubtitle(props.buyerPolishedShell)} />
</>
  );
}

function HomeRecentReviewsSection(props: { readonly model: OperatorHomePageViewModel }) {
  return (
    <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
      <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
      {/* Outcome line renders inside the runs panel from live list rows (avoids empty vs sample mismatch). */}
      <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
    </section>
  );
}

function BuyerPolishedHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  const initialHasReviews = (props.model.runsDashboard?.items.length ?? 0) > 0;

  return (

    <OperatorHomeWorkspaceActivityProvider initialHasReviews={initialHasReviews}>

      <UnfinishedWorkRail runs={props.model.runsDashboard.items} />

      <BuyerPolishedHomeHeroSectionDeferred runsDashboard={props.model.runsDashboard} />

      <HomeRecentReviewsSection model={props.model} />

      <OperatorHomeBelowFoldPanelsDeferred buyerPolishedShell model={props.model} />

      <OperatorHomeExecutiveRoiStripDeferred />

    </OperatorHomeWorkspaceActivityProvider>

  );
}

function OperatorHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    props.model.runsDashboard.items,
    props.model.runsDashboard.totalCount,
  );

  return (

    <OperatorHomeWorkspaceActivityProvider
      initialHasReviews={workspaceMetrics.hasReviews}
      initialOpenFindingsCount={workspaceMetrics.openFindings}
    >

      <UnfinishedWorkRail runs={props.model.runsDashboard.items} />

      <section aria-label="Overview command center" data-testid="operator-home-pilot-command-center-host">

        <PilotCommandCenterCardDeferred
          openFindingsCount={workspaceMetrics.openFindings}
          governanceWarningsCount={workspaceMetrics.governanceWarnings}
          hasWorkspaceReviews={workspaceMetrics.hasReviews}
          runsDashboard={props.model.runsDashboard}
          suppressLeadCopy
          showContextualHelp={false}
        />

      </section>

      <HomeRecentReviewsSection model={props.model} />

      <OperatorHomeBelowFoldPanelsDeferred
        buyerPolishedShell={false}
        model={props.model}
        showFirstValueCallout
      />

      <OperatorHomeExecutiveRoiStripDeferred />

    </OperatorHomeWorkspaceActivityProvider>

  );
}

/** Landing page: hero CTA, workspace activity, and collapsed advanced guidance. */
export function OperatorHomePageView({ model }: OperatorHomePageViewProps) {
  const buyerPolishedShell = model.buyerPolishedShell;

  return (
    <OperatorHomeGateDeferred>
      <OperatorHomeRefreshProvider>
        <OperatorHomeDeferredOnboarding />
        <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.majorSectionGap}>
          <OperatorHomePageChrome buyerPolishedShell={buyerPolishedShell} />
          {/* The continue rail renders inside each body so it reads the same live reviews snapshot. */}
          {buyerPolishedShell ? <BuyerPolishedHomePageBody model={model} /> : <OperatorHomePageBody model={model} />}
        </OperatorPageContainer>
      </OperatorHomeRefreshProvider>
    </OperatorHomeGateDeferred>
  );
}
