import { OperatorHomeAdvancedGuidancePanel } from "@/components/operator-home/OperatorHomeAdvancedGuidancePanel";
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

function BuyerPolishedHomePageBody() {
  return (
    <>
      <BuyerPolishedHomeHeroSection />

      <OperatorHomeExecutiveRoiStrip />

      <OperatorHomeSampleReviewPreview />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <OperatorHomeRunsPanel hideHeading />
      </section>

      <OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} />

      <OperatorHomeAdvancedGuidancePanel buyerPolishedShell checklistVariant="compact" />
    </>
  );
}

function OperatorHomePageBody() {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <>
      <PilotCommandCenterCard />
      <OperatorHomeExecutiveRoiStrip />
      <OperatorHomeFirstValueCallout />

      <OperatorHomeSampleReviewPreview />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <OperatorHomeRunsPanel hideHeading />
      </section>

      <OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={fullOperatorShell} />

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
        {buyerPolishedShell ? <BuyerPolishedHomePageBody /> : <OperatorHomePageBody />}
      </OperatorPageContainer>
    </OperatorHomeGate>
  );
}
