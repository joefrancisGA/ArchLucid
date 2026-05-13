import { OnboardingPageView } from "./_sections/OnboardingPageView";
import type { OnboardingPageViewModel } from "./_sections/onboarding-page-view-model";

type OnboardingPageProps = {
  searchParams: Promise<{ source?: string }>;
};

/**
 * Canonical onboarding orientation: trial card when `?source=registration` is set,
 * followed by the core first-review checklist wizard.
 */
export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const p = await searchParams;
  const model: OnboardingPageViewModel = {
    fromRegistration: p.source === "registration",
  };

  return <OnboardingPageView model={model} />;
}
