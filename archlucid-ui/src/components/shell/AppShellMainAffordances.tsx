"use client";

import { usePathname } from "next/navigation";

import { ContextualPageHintStrip } from "@/components/ContextualPageHintStrip";
import { KeyboardShortcutsDiscoverabilityCoach } from "@/components/KeyboardShortcutsDiscoverabilityCoach";
import { OperatorRecentViewsTracker } from "@/components/operator/OperatorRecentViewsTracker";
import { BuyerGoldenJourneyLayerContextStrip } from "@/components/shell/BuyerGoldenJourneyLayerContextStrip";
import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";
import { ExplainThisViewBanner } from "@/components/usability/ExplainThisViewBanner";
import { FirstVisitHelpAutoOpen } from "@/components/usability/FirstVisitHelpAutoOpen";
import { PersistentWorkspaceNextActionStrip } from "@/components/usability/PersistentWorkspaceNextActionStrip";
import { PageContextualHelpFab } from "@/components/usability/PageContextualHelpFab";
import { RecentReviewsResumeStrip } from "@/components/usability/RecentReviewsResumeStrip";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";

/** Non-critical main-column affordances loaded after the shell paints. */
export function AppShellMainAffordances() {
  const pathname = usePathname() ?? "/";
  const isOperatorHome = pathname === "/";
  const staticDemoEnv = isExplicitStaticDemoMarketingBuild();

  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      <PersistentWorkspaceNextActionStrip />
      {isOperatorHome ? <RecentReviewsResumeStrip /> : null}
      <OperatorRecentViewsTracker />
      <ReviewsListReturnStateTracker />
      <FirstVisitHelpAutoOpen />
      <KeyboardShortcutsDiscoverabilityCoach />
      {staticDemoEnv ? (
        <DemoVsLiveChromeBanner isStaticDemoEnv showWatermark className="mb-3" />
      ) : null}
      <ExplainThisViewBanner />
      <ContextualPageHintStrip />
      <PageContextualHelpFab />
    </>
  );
}
