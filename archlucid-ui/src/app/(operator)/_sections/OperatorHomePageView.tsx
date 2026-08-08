"use client";

import { DevTestingQuickSwitchPanel } from "@/components/dev-testing/DevTestingQuickSwitchPanel";
import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";
import {
  OperatorHomeDeferredOnboarding,
  OperatorHomeFirstValueCallout,
} from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { OperatorHomeExamplesPlacement } from "@/components/operator-home/OperatorHomeExamplesPlacement";
import {
  OperatorHomeRunsPanel,
} from "@/components/operator-home/OperatorHomeDeferredPanels";
import { OperatorHomeWorkspaceContextDisclosure } from "@/components/operator-home/OperatorHomeWorkspaceContextDisclosure";
import { OperatorHomeExecutiveRoiStrip } from "@/components/operator-home/OperatorHomeExecutiveRoiStrip";
import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";
import { OperatorHomeWorkspaceActivityProvider } from "@/components/operator-home/operator-home-workspace-activity-context";
import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { OperatorHomeGate } from "@/components/OperatorHomeGate";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import {
  OPERATOR_HOME_PRIMARY_SECTION_HEADING,
  OPERATOR_LAYOUT,
} from "@/lib/design-tokens";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  operatorHomePageSubtitle,
} from "@/lib/operator-home-page-copy";
import { OperatorHomeRefreshProvider } from "@/lib/operator-home-refresh-context";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";
import { OperatorHomePageHeader } from "./OperatorHomePageHeader";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";

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

      <BuyerPolishedHomeHeroSection runsDashboard={props.model.runsDashboard} />

      <HomeRecentReviewsSection model={props.model} />

      <OperatorHomeExecutiveRoiStrip />

      <OperatorHomeExamplesPlacement
        beforeWorkspaceContext={null}
        afterWorkspaceContext={
          <>
            <OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={props.model.runsDashboard} />
            <OperatorHomeAdvancedGuidancePanel buyerPolishedShell checklistVariant="compact" />
          </>
        }
      />

      <DevTestingQuickSwitchPanel />

    </OperatorHomeWorkspaceActivityProvider>

  );
}

function OperatorHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();
  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    props.model.runsDashboard.items,
    props.model.runsDashboard.totalCount,
  );

  return (

    <OperatorHomeWorkspaceActivityProvider
      initialHasReviews={workspaceMetrics.hasReviews}
      initialOpenFindingsCount={workspaceMetrics.openFindings}
    >

      <section aria-label="Overview command center" data-testid="operator-home-pilot-command-center-host">

        <PilotCommandCenterCard
          openFindingsCount={workspaceMetrics.openFindings}
          governanceWarningsCount={workspaceMetrics.governanceWarnings}
          hasWorkspaceReviews={workspaceMetrics.hasReviews}
          runsDashboard={props.model.runsDashboard}
          suppressLeadCopy
          showContextualHelp={false}
        />

      </section>

      <HomeRecentReviewsSection model={props.model} />

      <OperatorHomeExecutiveRoiStrip />

      <OperatorHomeFirstValueCallout />

      <OperatorHomeExamplesPlacement
        beforeWorkspaceContext={null}
        afterWorkspaceContext={
          <>
            <OperatorHomeWorkspaceContextDisclosure
              showWorkspaceStatus={fullOperatorShell}
              runsDashboard={props.model.runsDashboard}
            />
            <OperatorHomeAdvancedGuidancePanel
              buyerPolishedShell={false}
              fullOperatorShell={fullOperatorShell}
              checklistVariant={fullOperatorShell ? "full" : "compact"}
            />
          </>
        }
      />

      <DevTestingQuickSwitchPanel />

    </OperatorHomeWorkspaceActivityProvider>

  );
}

/** Landing page: hero CTA, workspace activity, and collapsed advanced guidance. */
export function OperatorHomePageView({ model }: OperatorHomePageViewProps) {
  const buyerPolishedShell = model.buyerPolishedShell;

  return (
    <OperatorHomeGate>
      <OperatorHomeRefreshProvider>
        <OperatorHomeDeferredOnboarding />
        <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.majorSectionGap}>
          <OperatorHomePageChrome buyerPolishedShell={buyerPolishedShell} />
{buyerPolishedShell ? <BuyerPolishedHomePageBody model={model} /> : <OperatorHomePageBody model={model} />}
        </OperatorPageContainer>
      </OperatorHomeRefreshProvider>
    </OperatorHomeGate>
  );
}
