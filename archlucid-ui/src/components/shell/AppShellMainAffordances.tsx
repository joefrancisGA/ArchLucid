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
import { CorePilotCompleteCelebrateStrip } from "@/components/usability/CorePilotCompleteCelebrateStrip";
import { GlobalSearchShortcutCoach } from "@/components/usability/GlobalSearchShortcutCoach";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";
import { isHelpOnHelpPath } from "@/lib/help/help-on-help";

/** Non-critical main-column affordances loaded after the shell paints. */
export function AppShellMainAffordances() {
  const pathname = usePathname() ?? "/";
  const isOperatorHome = pathname === "/";
  const isHelpTopic = isHelpOnHelpPath(pathname);
  const staticDemoEnv = isExplicitStaticDemoMarketingBuild();

  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      {isOperatorHome || isHelpTopic ? null : <PersistentWorkspaceNextActionStrip />}
      {isOperatorHome ? <RecentReviewsResumeStrip /> : null}
      {isOperatorHome ? <CorePilotCompleteCelebrateStrip /> : null}
      <GlobalSearchShortcutCoach />
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
