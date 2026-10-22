import { FirstReviewGuidePageClient } from "./FirstReviewGuidePageClient";
import type { OnboardingPageViewModel } from "./onboarding-page-view-model";

type OnboardingPageViewProps = {
  model: OnboardingPageViewModel;
};

/** Canonical first-review guide — focused onboarding for the first architecture review. */
export function OnboardingPageView({ model }: OnboardingPageViewProps) {
  return <FirstReviewGuidePageClient model={model} />;
}
