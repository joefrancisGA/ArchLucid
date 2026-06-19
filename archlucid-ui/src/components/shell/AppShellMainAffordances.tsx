"use client";

import dynamic from "next/dynamic";

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

const ExplainThisViewBanner = dynamic(
  () =>
    import("@/components/usability/ExplainThisViewBanner").then(
      (module) => module.ExplainThisViewBanner,
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
      <Breadcrumbs />
      <OperatorRecentViewsTracker />
      <ReviewsListReturnStateTracker />
      <FirstVisitHelpAutoOpen />
      <ExplainThisViewBanner />
      <ContextualPageHintStrip />
    </>
  );
}
