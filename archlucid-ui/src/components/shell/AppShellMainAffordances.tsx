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
import { CorePilotCompleteCelebrateStrip } from "@/components/usability/CorePilotCompleteCelebrateStrip";
import { GlobalSearchShortcutCoach } from "@/components/usability/GlobalSearchShortcutCoach";
import { GovernanceFindingsReturnStateTracker } from "@/components/usability/GovernanceFindingsReturnStateTracker";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";
import { isPersistentWorkspaceNextActionStripPath } from "@/lib/persistent-workspace-next-action-strip-path";
import { useTeachingChromeVisible } from "@/lib/workspace-mode/use-teaching-chrome-visible";

/** Non-critical main-column affordances loaded after the shell paints. */
export function AppShellMainAffordances() {
  const pathname = usePathname() ?? "/";
  const teachingChromeVisible = useTeachingChromeVisible();
  const isOperatorHome = pathname === "/";
  const isPreferencesSettingsPath = pathname === "/account/preferences";
  const isHelpTopicPath = pathname === "/help" || pathname.startsWith("/help/");
  const isArchitectureScorecardPath = pathname === "/insights/architecture-scorecard";
  const isSettingsHubPath = pathname === "/administration";
  const isItsmOAuthCallbackPath = pathname === "/integrations/itsm/oauth/callback";
  const isDigestsHubPath = pathname === "/architecture/digests";
  const isReviewsHubPath = pathname === "/architecture/reviews";
  const isFirstReviewGuidePath = pathname === "/architecture/first-review-guide";
  const isAdvisoryScansHubPath =
    pathname === "/governance/advisory-scans" || pathname.startsWith("/governance/advisory-scans/");
  const isRecurrenceSchedulesPath =
    pathname === "/governance/recurrence-schedules" || pathname.startsWith("/governance/recurrence-schedules/");
  const hideShortcutCoaches =
    isPreferencesSettingsPath ||
    isHelpTopicPath ||
    isArchitectureScorecardPath ||
    isSettingsHubPath ||
    isItsmOAuthCallbackPath ||
    isDigestsHubPath ||
    isReviewsHubPath ||
    isFirstReviewGuidePath ||
    isAdvisoryScansHubPath ||
    isRecurrenceSchedulesPath;
  const showPersistentWorkspaceNextActionStrip = isPersistentWorkspaceNextActionStripPath(pathname);
  const staticDemoEnv = isExplicitStaticDemoMarketingBuild();

  if (!teachingChromeVisible) {
    return (
      <>
        <BuyerGoldenJourneyLayerContextStrip />
        <OperatorRecentViewsTracker />
        <ReviewsListReturnStateTracker />
        <GovernanceFindingsReturnStateTracker />
        {staticDemoEnv ? (
          <DemoVsLiveChromeBanner isStaticDemoEnv showWatermark className="mb-3" />
        ) : null}
        <PageContextualHelpFab />
      </>
    );
  }

  return (
    <>
      <BuyerGoldenJourneyLayerContextStrip />
      {showPersistentWorkspaceNextActionStrip && teachingChromeVisible ? (
        <PersistentWorkspaceNextActionStrip />
      ) : null}
      {isOperatorHome ? <CorePilotCompleteCelebrateStrip /> : null}
      {hideShortcutCoaches ? null : <GlobalSearchShortcutCoach />}
      <OperatorRecentViewsTracker />
      <ReviewsListReturnStateTracker />
      <GovernanceFindingsReturnStateTracker />
      <FirstVisitHelpAutoOpen />
      {hideShortcutCoaches ? null : <KeyboardShortcutsDiscoverabilityCoach />}
      {staticDemoEnv ? (
        <DemoVsLiveChromeBanner isStaticDemoEnv showWatermark className="mb-3" />
      ) : null}
      <ExplainThisViewBanner />
      <ContextualPageHintStrip />
      <PageContextualHelpFab />
    </>
  );
}
