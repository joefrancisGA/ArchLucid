"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Suspense, useLayoutEffect, useRef, useState, useCallback, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AppInsightsTelemetryInit } from "@/components/AppInsightsTelemetryInit";
import { AppToaster } from "@/components/AppToaster";
import { AuthPanel } from "@/components/AuthPanel";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContextualPageHintStrip } from "@/components/ContextualPageHintStrip";
import { OperatorRecentViewsTracker } from "@/components/OperatorRecentViewsTracker";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { HelpPanel } from "@/components/HelpPanel";
import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import { KeyboardShortcutProvider } from "@/components/KeyboardShortcutProvider";
import { LayerContextFromRoute } from "@/components/LayerContextFromRoute";
import { CorePilotWizardLauncher } from "@/components/CorePilotWizard";
import { PilotBaselineWizardLauncher } from "@/components/PilotBaselineWizardLauncher";
import { DemoStrictNavigationGate } from "@/components/DemoStrictNavigationGate";
import {
  OperatorChromeModeProvider,
  useOperatorChromeMode,
} from "@/components/OperatorChromeModeContext";
import { OperatorShellTopBar } from "@/components/shell/OperatorShellTopBar";
import { OperatorNavAuthorityProvider } from "@/components/OperatorNavAuthorityProvider";
import { OperatorRoleGate } from "@/components/OperatorRoleGate";
import { SidebarNav } from "@/components/SidebarNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { BuyerCtoDemoTourOverlay } from "@/components/BuyerCtoDemoTourOverlay";
import { CtoDemoJourneyCaptionBar } from "@/components/cto-demo/CtoDemoJourneyCaptionBar";
import { CtoDemoOfflineAutoFallbackListener } from "@/components/cto-demo/CtoDemoOfflineAutoFallbackListener";
import { CtoDemoPanicModeBanner } from "@/components/cto-demo/CtoDemoPanicModeBanner";
import { CtoDemoSpotlightOverlay } from "@/components/cto-demo/CtoDemoSpotlightOverlay";
import { CtoDemoStaticFallbackPresenterBanner } from "@/components/cto-demo/CtoDemoStaticFallbackPresenterBanner";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { SyncActiveRunFromPathname } from "@/components/SyncActiveRunFromPathname";
import { WorkspaceActiveRunProvider } from "@/components/WorkspaceActiveRunContext";
import { SystemHealthStatusStrip } from "@/components/operator-home/SystemHealthStatusStrip";
import { ExplainThisViewBanner } from "@/components/usability/ExplainThisViewBanner";
import { FirstVisitHelpAutoOpen } from "@/components/usability/FirstVisitHelpAutoOpen";
import { PersistentTrialStatusStrip } from "@/components/usability/PersistentTrialStatusStrip";
import { ReviewsListReturnStateTracker } from "@/components/usability/ReviewsListReturnStateTracker";
import { KeyboardShortcutsFooterHint } from "@/components/usability/KeyboardShortcutsFooterHint";
import { TrustCenterShellLink } from "@/components/usability/TrustCenterShellLink";
import { RegistrationOnboardingTourAutoStart } from "@/components/usability/RegistrationOnboardingTourAutoStart";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { SessionIdleTimeoutGuard } from "@/components/SessionIdleTimeoutGuard";
import { ServiceBusHealthBanner } from "@/components/governance/ServiceBusHealthBanner";
import { SetupHealthShellBanner } from "@/components/usability/SetupHealthShellBanner";
import { LlmBudgetApproachingLimitBanner } from "@/components/LlmBudgetApproachingLimitBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialExpiryBanner } from "@/components/TrialExpiryBanner";
import { TeamExpansionNudge } from "@/components/TeamExpansionNudge";
import { TrialUsageUpgradeNudge } from "@/components/TrialUsageUpgradeNudge";
import { TrialLimitModalHost } from "@/components/TrialLimitModal";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import { OPERATOR_SHELL_MAX_WIDTH_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useRouteChangeFocus } from "@/hooks/useRouteChangeFocus";

type AppShellClientProps = {
  children: ReactNode;
};

/**
 * Operator shell: sticky header rail (logo, auth/environment, scope, global search with Ctrl+K hint, help, theme) plus layer-context /
 * buyer journey strip pinned together under one sticky stack; breadcrumbs inside header; collapsible sidebar nav landmark (lg+),
 * collapsible sidebar nav landmark (lg+), mobile drawer, keyboard shortcuts, primary <main> landmark.
 */
export function AppShellClient({ children }: AppShellClientProps) {
  return (
    <OperatorChromeModeProvider>
      <AppShellInner>{children}</AppShellInner>
    </OperatorChromeModeProvider>
  );
}

function AppShellInner({ children }: AppShellClientProps) {
  const pathname = usePathname();
  const chromeMode = useOperatorChromeMode();
  const [helpGuidesOpen, setHelpGuidesOpen] = useState(false);
  const [helpDocSearchOpen, setHelpDocSearchOpen] = useState(false);
  const openHelpSearch = useCallback(() => {
    setHelpDocSearchOpen(true);
  }, []);
  const shellRootRef = useRef<HTMLDivElement>(null);
  useRouteChangeFocus("main-content");

  /** Omit platform readiness on operator home — avoids “Healthy” next to an empty or fragile demo workspace story. */
  const hideWorkspaceHealthFooter =
    pathname === "/" ||
    pathname.startsWith("/graph") ||
    pathname.startsWith("/ask") ||
    pathname.startsWith("/governance") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/alerts") ||
    pathname.startsWith("/policy-packs") ||
    (pathname.startsWith("/reviews/") && pathname.split("/").filter(Boolean).length >= 2) ||
    (pathname.startsWith("/executive/reviews/") && pathname.split("/").filter(Boolean).length >= 3);

  /** Auth flow pages (sign-in, callback) render without nav/workspace chrome to avoid confusion. */
  const isAuthRoute = pathname.startsWith("/auth/");

  /** `useLayoutEffect`: runs before paint so Playwright sees the marker as soon as the shell DOM commits. */
  useLayoutEffect(() => {
    shellRootRef.current?.setAttribute("data-app-ready", "true");
  }, []);

  if (isAuthRoute) {
    return (
      <div
        ref={shellRootRef}
        className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950"
      >
        <div className="mb-8">
          <ArchLucidWordmarkLink href="/" aria-label="ArchLucid" variant="operator" />
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
        <AppToaster />
        <RouteAnnouncer />
      </div>
    );
  }

  if (chromeMode === "minimal") {
    return (
      <OperatorNavAuthorityProvider>
        <WorkspaceActiveRunProvider>
          <TooltipProvider delayDuration={200}>
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            <div
              ref={shellRootRef}
              data-testid="app-shell-minimal-root"
              className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950"
            >
              <div className="sticky top-0 z-30 bg-neutral-50 shadow-sm dark:bg-neutral-950 print:hidden">
                <header
                  data-testid="app-shell-minimal-topbar"
                  className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6")}>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                      <h1 className="m-0">
                        <Button variant="ghost" className="h-auto p-0" asChild>
                          <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to operator home" variant="operator" />
                        </Button>
                      </h1>
                      <Link
                        href="/reviews?projectId=default"
                        className="text-sm font-semibold text-teal-800 underline underline-offset-2 dark:text-teal-300"
                      >
                        Reviews
                      </Link>
                      <Link
                        href="/"
                        className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-300"
                      >
                        Home
                      </Link>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <AuthPanel />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={OPERATOR_HELP_ARIA_LABEL}
                            aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
                            onClick={() => {
                              openHelpSearch();
                            }}
                          >
                            <CircleHelp className="h-4 w-4" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{OPERATOR_HELP_TOOLTIP}</TooltipContent>
                      </Tooltip>
                      {isUiAuthorityThemeEvalEnabledEnv() ? <AuthorityThemeToggle /> : null}
                      <ColorModeToggle />
                    </div>
                  </div>
                </header>
                <LayerContextFromRoute />
              </div>
              <div
                data-testid="app-shell-main"
                className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6")}
              >
                <ServiceBusHealthBanner />
                <LlmBudgetApproachingLimitBanner />
                <TrialUsageUpgradeNudge />
                <TeamExpansionNudge />
                <TrialExpiryBanner />
                <KeyboardShortcutProvider onHelpRequested={openHelpSearch}>
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                  >
                    <SyncActiveRunFromPathname />
                    <DemoStrictNavigationGate>
                      <OperatorRoleGate>{children}</OperatorRoleGate>
                    </DemoStrictNavigationGate>
                  </main>
                </KeyboardShortcutProvider>
              </div>
            </div>
            <AppToaster />
            <RouteAnnouncer />
            <TrialLimitModalHost />
            <HelpSearchPanel
              open={helpDocSearchOpen}
              onOpenChange={setHelpDocSearchOpen}
              onOpenGuidesPanel={() => {
                setHelpGuidesOpen(true);
              }}
            />
            <HelpPanel open={helpGuidesOpen} onOpenChange={setHelpGuidesOpen} />
          </TooltipProvider>
        </WorkspaceActiveRunProvider>
      </OperatorNavAuthorityProvider>
    );
  }

  return (
    <OperatorNavAuthorityProvider>
      <WorkspaceActiveRunProvider>
      <AppInsightsTelemetryInit />
      <SessionIdleTimeoutGuard />
      <TooltipProvider delayDuration={200}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div ref={shellRootRef} className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-50 dark:bg-neutral-950">
          <div className="sticky top-0 z-30 overflow-x-hidden bg-neutral-50 shadow-sm dark:bg-neutral-950 print:hidden">
            <OperatorShellTopBar onOpenHelpSearch={openHelpSearch} />
            <LayerContextFromRoute />
            <CtoDemoJourneyCaptionBar />
          </div>
          <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex flex-1")}>
            <nav
              data-testid="sidebar-nav"
              aria-label="Primary navigation"
              className="hidden w-[15.5rem] shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50/80 px-2 py-4 print:!hidden dark:border-neutral-800 dark:bg-neutral-950/80 lg:block"
            >
              <SidebarNav />
            </nav>
            <div data-testid="app-shell-main" className="min-w-0 flex-1 px-4 py-4 print:px-0 lg:px-6 lg:py-6">
              <CtoDemoStaticFallbackPresenterBanner />
              <ServiceBusHealthBanner />
              <SetupHealthShellBanner />
              <LlmBudgetApproachingLimitBanner />
              <TrialUsageUpgradeNudge />
              <TeamExpansionNudge />
              <TrialExpiryBanner />
              <PersistentTrialStatusStrip />
              <TrialBanner />
              <KeyboardShortcutProvider onHelpRequested={openHelpSearch}>
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                    <Breadcrumbs />
                    <SyncActiveRunFromPathname />
                    <OperatorRecentViewsTracker />
                    <ReviewsListReturnStateTracker />
                    <FirstVisitHelpAutoOpen />
                    <ExplainThisViewBanner />
                    <ContextualPageHintStrip />
                    <DemoStrictNavigationGate>
                      <OperatorRoleGate>{children}</OperatorRoleGate>
                    </DemoStrictNavigationGate>
                </main>
              </KeyboardShortcutProvider>
            </div>
          </div>
          {isBuyerPolishedOperatorShellEnv() ? (
            <footer
              className="border-t border-neutral-200 bg-neutral-50/90 py-2 print:hidden dark:border-neutral-800 dark:bg-neutral-950/90"
              aria-label="Trust and compliance"
            >
              <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex items-center justify-end gap-3 px-4 lg:px-6")}>
                <TrustCenterShellLink variant="footer" />
              </div>
            </footer>
          ) : !isNextPublicDemoMode() && !hideWorkspaceHealthFooter ? (
            <footer
              className="border-t border-neutral-200 bg-neutral-50/90 py-2 print:hidden dark:border-neutral-800 dark:bg-neutral-950/90"
              aria-label="Workspace footer"
            >
              <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex items-center justify-between gap-3 px-4 lg:px-6")}>
                <SystemHealthStatusStrip className="mb-0 min-w-0 flex-1" />
                <KeyboardShortcutsFooterHint />
              </div>
            </footer>
          ) : null}
        </div>
        <AppToaster />
        <RouteAnnouncer />
        <TrialLimitModalHost />
        <HelpSearchPanel
          open={helpDocSearchOpen}
          onOpenChange={setHelpDocSearchOpen}
          onOpenGuidesPanel={() => {
            setHelpGuidesOpen(true);
          }}
        />
        <HelpPanel open={helpGuidesOpen} onOpenChange={setHelpGuidesOpen} />
        <CorePilotWizardLauncher />
        <PilotBaselineWizardLauncher />
        <OnboardingTour />
        <Suspense fallback={null}>
          <RegistrationOnboardingTourAutoStart />
        </Suspense>
        <CtoDemoOfflineAutoFallbackListener />
        <CtoDemoPanicModeBanner />
        <CtoDemoSpotlightOverlay />
        <Suspense fallback={null}>
          <BuyerCtoDemoTourOverlay />
        </Suspense>
      </TooltipProvider>
      </WorkspaceActiveRunProvider>
    </OperatorNavAuthorityProvider>
  );
}
