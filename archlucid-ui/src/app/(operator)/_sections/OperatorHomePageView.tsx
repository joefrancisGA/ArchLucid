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
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING, OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD } from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";
import { cn } from "@/lib/utils";

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

function HomeRecentReviewsSection(props: { readonly model: OperatorHomePageViewModel }) {
  return (
    <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
      <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        {OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD}
      </p>
      <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
    </section>
  );
}

function buildExamplesPlacement(
  model: OperatorHomePageViewModel,
  options: { readonly buyerPolishedShell: boolean; readonly fullOperatorShell: boolean },
) {
  return (
    <OperatorHomeExamplesPlacement
      beforeWorkspaceContext={null}
      afterWorkspaceContext={
        <>
          <OperatorHomeWorkspaceContextDisclosure
            showWorkspaceStatus={options.fullOperatorShell}
            runsDashboard={model.runsDashboard}
          />
          <OperatorHomeAdvancedGuidancePanel
            buyerPolishedShell={options.buyerPolishedShell}
            fullOperatorShell={options.fullOperatorShell}
            checklistVariant={options.fullOperatorShell ? "full" : "compact"}
          />
        </>
      }
    />
  );
}

function resolveHomeQuickJumpRunIds(model: OperatorHomePageViewModel): string[] {
  return (model.runsDashboard?.items ?? [])
    .map((run) => run.runId?.trim() ?? "")
    .filter((runId) => runId.length > 0);
}

function HomeRecentReviewsSection(props: { readonly model: OperatorHomePageViewModel }) {
  return (
    <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
      <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        {OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD}
      </p>
      <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
    </section>
  );
}



function BuyerPolishedHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  const initialHasReviews = (props.model.runsDashboard?.items.length ?? 0) > 0;
  const quickJumpRunIds = resolveHomeQuickJumpRunIds(props.model);

  const initialHasReviews = (props.model.runsDashboard?.items.length ?? 0) > 0;

  return (

    <OperatorHomeWorkspaceActivityProvider initialHasReviews={initialHasReviews}>

      <BuyerPolishedHomeHeroSection />

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
  const initialHasReviews = (props.model.runsDashboard?.items.length ?? 0) > 0;



  return (

    <OperatorHomeWorkspaceActivityProvider initialHasReviews={initialHasReviews}>

      <section aria-label="Overview command center" data-testid="operator-home-pilot-command-center-host">

        <PilotCommandCenterCard />

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
      <OperatorHomeDeferredOnboarding />
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.majorSectionGap}>
        {buyerPolishedShell ? <BuyerPolishedHomePageBody model={model} /> : <OperatorHomePageBody model={model} />}
      </OperatorPageContainer>
    </OperatorHomeGate>
  );
}
