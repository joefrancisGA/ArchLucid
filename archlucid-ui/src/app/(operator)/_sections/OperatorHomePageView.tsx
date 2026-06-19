import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { FirstValueReachedCallout } from "@/components/FirstValueReachedCallout";
import { OperatorHomeAdvancedGuidanceSection } from "@/components/operator-home/OperatorHomeAdvancedGuidanceSection";
import { OperatorHomeExampleRequestPanel } from "@/components/operator-home/OperatorHomeExampleRequestPanel";
import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import { OperatorHomeWorkspaceStatusSection } from "@/components/operator-home/OperatorHomeWorkspaceStatusSection";
import { BuyerPolishedHomeHeroSection } from "@/components/operator-home/BuyerPolishedHomeHeroSection";
import { RunsDashboardPanel } from "@/components/operator-home/RunsDashboardPanel";
import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { OperatorHomeGate } from "@/components/OperatorHomeGate";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { TrialWelcomeRunDeepLink } from "@/components/TrialWelcomeRunDeepLink";
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

      <OperatorHomeExampleRequestPanel />
      <OperatorHomeSampleReviewPreview />

      <BeforeAfterDeltaPanel />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <RunsDashboardPanel hideHeading />
      </section>

      <OperatorHomeAdvancedGuidanceSection buyerPolishedShell checklistVariant="compact" />
    </>
  );
}

function OperatorHomePageBody() {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <>
      <PilotCommandCenterCard />
      <FirstValueReachedCallout />

      <OperatorHomeExampleRequestPanel />
      <OperatorHomeSampleReviewPreview />

      <BeforeAfterDeltaPanel />

      <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
        <RunsDashboardPanel hideHeading />
      </section>

      <OperatorHomeAdvancedGuidanceSection
        buyerPolishedShell={false}
        fullOperatorShell={fullOperatorShell}
        checklistVariant={fullOperatorShell ? "full" : "compact"}
      />

      {fullOperatorShell ? <OperatorHomeWorkspaceStatusSection /> : null}
    </>
  );
}

/** Landing page: hero CTA, recent reviews, and collapsed advanced guidance. */
export function OperatorHomePageView({ model }: OperatorHomePageViewProps) {
  const buyerPolishedShell = model.buyerPolishedShell;

  return (
    <OperatorHomeGate>
      <TrialWelcomeRunDeepLink />
      <OperatorWelcomeOnboarding />
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.majorSectionGap}>
        {buyerPolishedShell ? <BuyerPolishedHomePageBody /> : <OperatorHomePageBody />}
      </OperatorPageContainer>
    </OperatorHomeGate>
  );
}
