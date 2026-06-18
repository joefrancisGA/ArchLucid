import Link from "next/link";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { FinishSetupWizardPanel } from "@/components/FinishSetupWizardPanel";
import { TryCliDemoCard } from "@/components/TryCliDemoCard";
import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { CorePilotProgressTrackerBanner } from "@/components/usability/CorePilotProgressTrackerBanner";
import { UnifiedFirstPilotProgressPanel } from "@/components/usability/UnifiedFirstPilotProgressPanel";

import type { OnboardingPageViewModel } from "./onboarding-page-view-model";

type OnboardingPageViewProps = {
  model: OnboardingPageViewModel;
};

/**
 * Canonical onboarding orientation: optional trial card when arriving from registration,
 * plus the unified first-pilot progress panel.
 */
export function OnboardingPageView({ model }: OnboardingPageViewProps) {
  const { fromRegistration } = model;

  return (
    <OperatorPageContainer variant="reading" className="space-y-8">
      <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">
        Onboarding
      </h1>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
        Follow the checklist below to complete your first architecture review. For the full home overview, go to{" "}
        <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        .
      </p>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
        Prefer proof before wiring your own tenant?{" "}
        <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/demo/preview">
          See the evidence trail walkthrough
        </Link>
        .
      </p>
      <CorePilotProgressTrackerBanner />
      <FirstWeekRouteGuidance variant="onboarding" />
      <div className="flex flex-wrap items-center gap-2">
        <InAppHelpLink helpSlug="first-pilot-path" label="First-pilot operator path — full walkthrough" />
        <InAppHelpLink helpSlug="specialty-walkthroughs" label="Specialty templates (optional, after first commit)" />
      </div>
      <GettingStartedTrialSection fromRegistrationQuery={fromRegistration} />
      <section aria-labelledby="onboarding-roi-baseline-setup-heading" data-testid="onboarding-roi-baseline-setup">
        <h2 id="onboarding-roi-baseline-setup-heading" className="m-0 text-base font-semibold text-al-text-primary">
          Configure ROI baseline
        </h2>
        <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
          Add baseline assumptions so Portfolio overview can show estimated savings and sponsor ROI.
        </p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/settings/baseline">Configure ROI baseline</Link>
          </Button>
        </div>
      </section>
      <FinishSetupWizardPanel />
      <TryCliDemoCard />
      <UnifiedFirstPilotProgressPanel checklistVariant="full" />
    </OperatorPageContainer>
  );
}
