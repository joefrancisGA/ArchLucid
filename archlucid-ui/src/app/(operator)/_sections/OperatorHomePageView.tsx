import { AfterCorePilotChecklistHint } from "@/components/AfterCorePilotChecklistHint";
import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { BuyerGoldenJourneyStrip } from "@/components/BuyerGoldenJourneyStrip";
import { CorePilotBuyerStepHint } from "@/components/CorePilotBuyerStepHint";
import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";
import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";
import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { CorePilotNextStepsCard } from "@/components/CorePilotNextStepsCard";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { HomeFirstRunWorkflowGate } from "@/components/HomeFirstRunWorkflowGate";
import { LlmUsageBandHint } from "@/components/LlmUsageBandHint";
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
import { BUYER_HOME_SETUP_SECTION_HEADING } from "@/lib/buyer-polish-copy";

import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";

type OperatorHomePageViewProps = {
  model: OperatorHomePageViewModel;
};

function BuyerHomeSectionHeading(props: { readonly id: string; readonly children: string }) {
  return (
    <h2
      id={props.id}
      className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300"
    >
      {props.children}
    </h2>
  );
}

function OperatorHomeReviewsGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
      <div className="min-w-0 space-y-6">
        <RunsDashboardPanel />
        <OperatorCorePilotDiagnosticsChecklist />
        <AfterCorePilotChecklistHint />

        <OperationalMetricsGate>
          <div className="space-y-6" data-testid="operator-home-post-commit-surfaces">
            <RepeatReviewActivationPrompt />
            <ValueRealizationDashboard />
            <OperatorNextActionsCard />
            <OperatorStickinessSnapshotCard />
          </div>

          <section aria-labelledby="operational-metrics-heading">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3
                id="operational-metrics-heading"
                className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300"
              >
                Operational metrics
              </h3>

              <InAppHelpLink helpSlug="core-pilot" label="Open the core pilot guide" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PilotOutcomeCard />
              <OperatorTaskSuccessTile />
            </div>
          </section>

          <HomeMaturityLayerCards />
        </OperationalMetricsGate>

        <BeforeAfterDeltaPanel />
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
        aria-label="Review package status and proof"
        className="space-y-6"
        data-testid="operator-home-proof-section"
      >
        <SampleFirstReviewPackageCard />
        <RunsDashboardPanel />
        <BeforeAfterDeltaPanel />
      </section>

      <section aria-label="Recommended review journey" data-testid="operator-home-journey-section">
        <BuyerGoldenJourneyStrip />
      </section>

      <section
        aria-labelledby="buyer-home-setup-heading"
        className="space-y-6"
        data-testid="operator-home-setup-section"
      >
        <BuyerHomeSectionHeading id="buyer-home-setup-heading">{BUYER_HOME_SETUP_SECTION_HEADING}</BuyerHomeSectionHeading>
        <CorePilotBuyerStepHint />
        <WelcomeBanner />
        <FirstPilotOperatingRail />
        <LlmUsageBandHint />
      </section>
    </>
  );
}

function OperatorHomePageBody() {
  return (
    <>
      <OperatorCoArchitectHomeStrip />
      <WelcomeBanner />
      <SampleFirstReviewPackageCard />
      <PilotRoiBaselineReadinessCard />
      <FirstPilotReadinessCockpit />
      <PilotStartHereStrip />

      <div className="max-w-prose space-y-3">
        <FirstWeekRouteGuidance variant="home" />
        <div className="flex flex-wrap items-center gap-2">
          <InAppHelpLink helpSlug="first-pilot-path" label="First-pilot operator path — full walkthrough" />
        </div>
      </div>

      <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
        Your reviews
      </h2>

      <OperatorHomeReviewsGrid />

      <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
        Get started
      </h2>

      <CorePilotNextStepsCard />
      <CorePilotChecklist />

      <FirstPilotOperatingRail />
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
      <div className="space-y-6">
        {buyerPolishedShell ? <BuyerPolishedHomePageBody /> : <OperatorHomePageBody />}
      </div>
    </OperatorHomeGate>
  );
}
