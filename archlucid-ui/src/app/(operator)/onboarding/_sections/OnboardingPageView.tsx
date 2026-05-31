import Link from "next/link";

import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";

import type { OnboardingPageViewModel } from "./onboarding-page-view-model";

type OnboardingPageViewProps = {
  model: OnboardingPageViewModel;
};

/**
 * Canonical onboarding orientation: optional trial card when arriving from registration,
 * plus the core first-review checklist wizard.
 */
export function OnboardingPageView({ model }: OnboardingPageViewProps) {
  const { fromRegistration } = model;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-1 sm:px-0">
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
      <FirstWeekRouteGuidance variant="onboarding" />
      <div className="flex flex-wrap items-center gap-2">
        <InAppHelpLink helpSlug="first-pilot-path" label="First-pilot operator path — full walkthrough" />
        <InAppHelpLink helpSlug="specialty-walkthroughs" label="Specialty templates (optional, after first commit)" />
      </div>
      <GettingStartedTrialSection fromRegistrationQuery={fromRegistration} />
      <div>
        <OperatorFirstRunWorkflowPanel />
      </div>
    </div>
  );
}
