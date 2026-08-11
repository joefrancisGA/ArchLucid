"use client";

import { ContextualPageHintStrip } from "@/components/ContextualPageHintStrip";
import { KeyboardShortcutsDiscoverabilityCoach } from "@/components/KeyboardShortcutsDiscoverabilityCoach";
import { OperatorRecentViewsTracker } from "@/components/OperatorRecentViewsTracker";
import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";
import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";
import { ExplainThisViewBanner } from "@/components/usability/ExplainThisViewBanner";
import { FirstVisitHelpAutoOpen } from "@/components/usability/FirstVisitHelpAutoOpen";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer-demo-content-gating";

/** Non-critical main-column affordances loaded after the shell paints. */
export function AppShellMainAffordances() {
  const staticDemoEnv = isExplicitStaticDemoMarketingBuild();

  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      <OperatorRecentViewsTracker />
      <ReviewsListReturnStateTracker />
      <FirstVisitHelpAutoOpen />
      <KeyboardShortcutsDiscoverabilityCoach />
      {staticDemoEnv ? (
        <DemoVsLiveChromeBanner isStaticDemoEnv showWatermark className="mb-3" />
      ) : null}
      <ExplainThisViewBanner />
      <ContextualPageHintStrip />
    </>
  );
}
