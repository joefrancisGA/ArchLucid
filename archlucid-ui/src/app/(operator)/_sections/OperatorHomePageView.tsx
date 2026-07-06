import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";
import { OperatorHomeDemoOperationsPanel } from "@/components/operator-home/OperatorHomeDemoOperationsPanel";
import {
  OperatorHomeDeferredOnboarding,
  OperatorHomeFirstValueCallout,
} from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import {
  OperatorHomeRunsPanel,
} from "@/components/operator-home/OperatorHomeDeferredPanels";
import { OperatorHomeWorkspaceContextDisclosure } from "@/components/operator-home/OperatorHomeWorkspaceContextDisclosure";
import { OperatorHomeExecutiveRoiStrip } from "@/components/operator-home/OperatorHomeExecutiveRoiStrip";
import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";
import { OperatorHomeContinueSetupSlot } from "@/components/operator-home/OperatorHomeContinueSetupSlot";
import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { OperatorHomeGate } from "@/components/OperatorHomeGate";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";

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

function BuyerPolishedHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  return (
    <>
      <BuyerPolishedHomeHeroSection />

      <OperatorHomeExecutiveRoiStrip />

      <OperatorHomeSampleReviewPreview />

      <OperatorHomeContinueSetupSlot placement="prominent" />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
      </section>

      <OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={props.model.runsDashboard} />

      <OperatorHomeAdvancedGuidancePanel buyerPolishedShell checklistVariant="compact" />
      <OperatorHomeDemoOperationsPanel />
    </>
  );
}

function OperatorHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <>
      <section aria-label="Pilot command center" data-testid="operator-home-pilot-command-center-host">
        <PilotCommandCenterCard />
      </section>
      <OperatorHomeExecutiveRoiStrip />
      <OperatorHomeFirstValueCallout />

      <OperatorHomeSampleReviewPreview />

      <OperatorHomeContinueSetupSlot placement="prominent" />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />
      </section>

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
  );
}

/** Landing page: hero CTA, recent reviews, and collapsed advanced guidance. */
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
