"use client";

import dynamic from "next/dynamic";

import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";
import { ExplainThisViewBanner } from "@/components/usability/ExplainThisViewBanner";

const Breadcrumbs = dynamic(
  () => import("@/components/Breadcrumbs").then((module) => module.Breadcrumbs),
  { loading: () => null },
);

const OperatorRecentViewsTracker = dynamic(
  () =>
    import("@/components/OperatorRecentViewsTracker").then(
      (module) => module.OperatorRecentViewsTracker,
    ),
  { loading: () => null },
);

const ReviewsListReturnStateTracker = dynamic(
  () =>
    import("@/components/usability/ReviewsListReturnStateTracker").then(
      (module) => module.ReviewsListReturnStateTracker,
    ),
  { loading: () => null },
);

const FirstVisitHelpAutoOpen = dynamic(
  () =>
    import("@/components/usability/FirstVisitHelpAutoOpen").then(
      (module) => module.FirstVisitHelpAutoOpen,
    ),
  { loading: () => null },
);

const ContextualPageHintStrip = dynamic(
  () =>
    import("@/components/ContextualPageHintStrip").then(
      (module) => module.ContextualPageHintStrip,
    ),
  { loading: () => null },
);

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
