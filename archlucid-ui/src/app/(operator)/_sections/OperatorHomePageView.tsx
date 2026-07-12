import { DevTestingQuickSwitchPanel } from "@/components/dev-testing/DevTestingQuickSwitchPanel";
import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";

import {

  OperatorHomeDeferredOnboarding,

  OperatorHomeFirstValueCallout,

} from "@/components/operator-home/OperatorHomeDeferredOnboarding";

import { OperatorHomeExploreSampleSection } from "@/components/operator-home/OperatorHomeExploreSampleSection";

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



function BuyerPolishedHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {

  return (

    <>

      <BuyerPolishedHomeHeroSection />



      <OperatorHomeContinueSetupSlot placement="prominent" />



      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>

        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>

        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD}
        </p>

        <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />

      </section>



      <OperatorHomeExecutiveRoiStrip />



      <OperatorHomeExploreSampleSection />



      <OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={props.model.runsDashboard} />



      <OperatorHomeAdvancedGuidancePanel buyerPolishedShell checklistVariant="compact" />
      <DevTestingQuickSwitchPanel />
    </>

  );

}



function OperatorHomePageBody(props: { readonly model: OperatorHomePageViewModel }) {

  const fullOperatorShell = isOperatorExperienceFullShellEnv();



  return (

    <>

      <section aria-label="Overview command center" data-testid="operator-home-pilot-command-center-host">

        <PilotCommandCenterCard />

      </section>



      <OperatorHomeContinueSetupSlot placement="prominent" />



      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>

        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>

        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          {OPERATOR_HOME_WORKSPACE_ACTIVITY_LEAD}
        </p>

        <OperatorHomeRunsPanel hideHeading initialModel={props.model.runsDashboard} />

      </section>



      <OperatorHomeExecutiveRoiStrip />

      <OperatorHomeFirstValueCallout />



      <OperatorHomeExploreSampleSection />



      <OperatorHomeWorkspaceContextDisclosure

        showWorkspaceStatus={fullOperatorShell}

        runsDashboard={props.model.runsDashboard}

      />



      <OperatorHomeAdvancedGuidancePanel

        buyerPolishedShell={false}

        fullOperatorShell={fullOperatorShell}

        checklistVariant={fullOperatorShell ? "full" : "compact"}

      />

      <DevTestingQuickSwitchPanel />
    </>

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

