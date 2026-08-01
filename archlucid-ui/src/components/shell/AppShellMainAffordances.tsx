"use client";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContextualPageHintStrip } from "@/components/ContextualPageHintStrip";
import { OperatorRecentViewsTracker } from "@/components/OperatorRecentViewsTracker";
import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";
import { ExplainThisViewBanner } from "@/components/usability/ExplainThisViewBanner";
import { FirstVisitHelpAutoOpen } from "@/components/usability/FirstVisitHelpAutoOpen";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";

/** Non-critical main-column affordances loaded after the shell paints. */
export function AppShellMainAffordances() {
  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      <Breadcrumbs />
      <OperatorRecentViewsTracker />
      <ReviewsListReturnStateTracker />
      <FirstVisitHelpAutoOpen />
      <ExplainThisViewBanner />
      <ContextualPageHintStrip />
    </>
  );
}
