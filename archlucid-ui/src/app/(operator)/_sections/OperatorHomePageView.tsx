import { AfterCorePilotChecklistHint } from "@/components/AfterCorePilotChecklistHint";
import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { BuyerGoldenJourneyStrip } from "@/components/BuyerGoldenJourneyStrip";
import { CorePilotBuyerStepHint } from "@/components/CorePilotBuyerStepHint";
import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";
import { FirstValueReachedCallout } from "@/components/FirstValueReachedCallout";
import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";
import { ReviewsAwaitingActionCard } from "@/components/governance/ReviewsAwaitingActionCard";
import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { CorePilotNextStepsCard } from "@/components/CorePilotNextStepsCard";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { OperatorHomeGuidanceLinks } from "@/components/operator-home/OperatorHomeGuidanceLinks";
import { HomeFirstRunWorkflowGate } from "@/components/HomeFirstRunWorkflowGate";
import { SamplePackageShortcutsCard } from "@/components/operator-home/SamplePackageShortcutsCard";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";
import { LlmUsageBandHint } from "@/components/LlmUsageBandHint";
import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import { HomeMaturityLayerCards } from "@/components/operator-home/HomeMaturityLayerCards";
import { PilotRoiBaselineReadinessCard } from "@/components/operator-home/PilotRoiBaselineReadinessCard";
import { PilotStartHereStrip } from "@/components/operator-home/PilotStartHereStrip";
import { OperationalMetricsGate } from "@/components/operator-home/OperationalMetricsGate";
import { RunsDashboardPanel } from "@/components/operator-home/RunsDashboardPanel";
import { OperatorCoArchitectHomeStrip } from "@/components/OperatorCoArchitectHomeStrip";
import { OperatorCorePilotDiagnosticsChecklist } from "@/components/OperatorCorePilotDiagnosticsChecklist";
import { OperatorHomeGate } from "@/components/OperatorHomeGate";
import { OperatorNextActionsCard } from "@/components/OperatorNextActionsCard";
import { OperatorStickinessSnapshotCard } from "@/components/OperatorStickinessSnapshotCard";
import { OperatorTaskSuccessTile } from "@/components/OperatorTaskSuccessTile";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { RepeatReviewActivationPrompt } from "@/components/RepeatReviewActivationPrompt";
import { PilotOutcomeCard } from "@/components/PilotOutcomeCard";
import { SampleFirstReviewPackageCard } from "@/components/SampleFirstReviewPackageCard";
import { TrialWelcomeRunDeepLink } from "@/components/TrialWelcomeRunDeepLink";
import { ValueRealizationDashboard } from "@/components/ValueRealizationDashboard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { BUYER_HOME_REVIEWS_SECTION_HEADING, BUYER_HOME_SETUP_SECTION_HEADING } from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_SECTION_HEADING } from "@/lib/design-tokens";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";

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

function OperatorHomeReviewsGrid() {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
      <div className="min-w-0 space-y-4">
        <RunsDashboardPanel hideHeading />
        {fullOperatorShell ? <OperatorCorePilotDiagnosticsChecklist /> : null}
        {fullOperatorShell ? <AfterCorePilotChecklistHint /> : null}

        {fullOperatorShell ? (
        <OperationalMetricsGate>
          <AcceleratorChooserCard />
          <div className="space-y-4" data-testid="operator-home-post-commit-surfaces">
            <RepeatReviewActivationPrompt />
            <ValueRealizationDashboard />
            <OperatorNextActionsCard />
            <OperatorStickinessSnapshotCard />
          </div>

          <section aria-labelledby="operational-metrics-heading">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 id="operational-metrics-heading" className={OPERATOR_HOME_SECTION_HEADING}>
                Operational metrics
              </h3>

              <OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open the core pilot guide" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PilotOutcomeCard />
              <OperatorTaskSuccessTile />
            </div>
          </section>

          <HomeMaturityLayerCards />
        </OperationalMetricsGate>
        ) : null}

        {fullOperatorShell ? <BeforeAfterDeltaPanel /> : null}
      </div>

      <aside
        className="min-w-0 space-y-3 pt-0 lg:sticky lg:top-20 lg:self-start"
        aria-label="Sample package shortcuts and first-review checklist"
      >
        <HomeFirstRunWorkflowGate />
      </aside>
    </div>
  );
}

function BuyerPolishedHomePageBody() {
  return (
    <>
      <section
        aria-label="Your first architecture review"
        className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start"
        data-testid="operator-home-hero-section"
      >
        <div className="min-w-0 space-y-4">
          <BuyerCtoDemoReadinessPanel />
          <StartCtoDemoCard />
          <FirstValueReachedCallout />
          <WelcomeBanner />
          <CorePilotBuyerStepHint />
          <BeforeAfterDeltaPanel />
          <OperatorCoArchitectHomeStrip buyerPolishedShell />
          <SampleFirstReviewPackageCard buyerPolishedShell={true} />
        </div>
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="Example review package shortcuts">
          <SamplePackageShortcutsCard />
        </aside>
      </section>

      <section aria-labelledby="operator-home-reviews-heading" className="space-y-4">
        <HomeSectionHeading id="operator-home-reviews-heading">{BUYER_HOME_REVIEWS_SECTION_HEADING}</HomeSectionHeading>
        <RunsDashboardPanel />
      </section>

      <section aria-label="Recommended review journey" data-testid="operator-home-journey-section">
        <BuyerGoldenJourneyStrip />
      </section>

      <section aria-labelledby="operator-home-readiness-heading" className="space-y-3">
        <FirstPilotReadinessCockpit />
      </section>

      <section
        aria-labelledby="buyer-home-setup-heading"
        className="space-y-4"
        data-testid="operator-home-setup-section"
      >
        <HomeSectionHeading id="buyer-home-setup-heading">{BUYER_HOME_SETUP_SECTION_HEADING}</HomeSectionHeading>
        <CorePilotChecklist variant="compact" />
        <FirstPilotOperatingRail />
      </section>
    </>
  );
}

function OperatorHomePageBody() {
  const fullOperatorShell = isOperatorExperienceFullShellEnv();

  return (
    <>
      {/* Zone 1: primary actions */}
      <div className="space-y-4">
        <FirstValueReachedCallout />
        <WelcomeBanner />
        <ReviewsAwaitingActionCard />
        <SampleFirstReviewPackageCard buyerPolishedShell={false} />
        {fullOperatorShell ? <OperatorCoArchitectHomeStrip /> : null}
      </div>

      {/* Zone 2: your reviews */}
      <section aria-labelledby="operator-home-reviews-heading" className="space-y-4">
        <HomeSectionHeading id="operator-home-reviews-heading">Your reviews</HomeSectionHeading>
        <OperatorHomeReviewsGrid />
      </section>

      {/* Zone 3: workspace readiness (collapsed by default) */}
      <section aria-labelledby="operator-home-readiness-heading" className="space-y-3">
        <HomeSectionHeading id="operator-home-readiness-heading">Workspace readiness</HomeSectionHeading>
        {fullOperatorShell ? <PilotRoiBaselineReadinessCard /> : null}
        <FirstPilotReadinessCockpit />
      </section>

      {/* Zone 4: getting started and checklists */}
      <section aria-labelledby="operator-home-started-heading" className="space-y-4">
        <HomeSectionHeading id="operator-home-started-heading">Get started</HomeSectionHeading>
        {fullOperatorShell ? <PilotStartHereStrip /> : null}
        {fullOperatorShell ? <CorePilotNextStepsCard /> : null}
        <div id="core-pilot-checklist-anchor">
          <CorePilotChecklist variant={fullOperatorShell ? "full" : "compact"} />
        </div>
        <FirstPilotOperatingRail />
        {fullOperatorShell ? (
          <div className="max-w-prose space-y-3">
            <FirstWeekRouteGuidance variant="home" />
            <OperatorHomeGuidanceLinks>
              <OperatorHomeGuidanceLink helpSlug="first-pilot-path" label="First pilot operator path — full walkthrough" />
            </OperatorHomeGuidanceLinks>
          </div>
        ) : null}
      </section>
    </>
  );
}

/** Landing page: hero CTA, action cards, workflow checklist, and operational metrics. */
export function OperatorHomePageView({ model }: OperatorHomePageViewProps) {
  const buyerPolishedShell = model.buyerPolishedShell;

  return (
    <OperatorHomeGate>
      <TrialWelcomeRunDeepLink />
      <OperatorWelcomeOnboarding />
      <div className="space-y-8">
        {buyerPolishedShell ? <BuyerPolishedHomePageBody /> : <OperatorHomePageBody />}
      </div>
    </OperatorHomeGate>
  );
}
