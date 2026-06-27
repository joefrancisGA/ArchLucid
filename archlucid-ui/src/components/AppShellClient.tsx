"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AppInsightsTelemetryInit } from "@/components/AppInsightsTelemetryInit";
import { FrictionlessTrialBanner } from "@/components/FrictionlessTrialBanner";
import { AppToaster } from "@/components/AppToaster";
import { OperatorQueryProvider } from "@/components/OperatorQueryProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { AppShellMainAffordances } from "@/components/shell/AppShellMainAffordances";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { KeyboardShortcutProvider } from "@/components/KeyboardShortcutProvider";
import { LayerContextFromRoute } from "@/components/LayerContextFromRoute";
import { DemoStrictNavigationGate } from "@/components/DemoStrictNavigationGate";
import { SponsorExecutiveShellRedirect } from "@/components/SponsorExecutiveShellRedirect";
import {
  OperatorChromeModeProvider,
  useOperatorChromeMode,
} from "@/components/OperatorChromeModeContext";
import { OperatorShellTopBar } from "@/components/shell/OperatorShellTopBar";
import { OperatorNavAuthorityProvider } from "@/components/OperatorNavAuthorityProvider";
import { OperatorRoleGate } from "@/components/OperatorRoleGate";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { SyncActiveRunFromPathname } from "@/components/SyncActiveRunFromPathname";
import { WorkspaceActiveRunProvider } from "@/components/WorkspaceActiveRunContext";
import { SystemHealthStatusStrip } from "@/components/operator-home/SystemHealthStatusStrip";
import { TrustCenterShellLink } from "@/components/usability/TrustCenterShellLink";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { UserAppearancePreferenceSync } from "@/components/UserAppearancePreferenceSync";
import { SessionIdleTimeoutGuard } from "@/components/SessionIdleTimeoutGuard";
import { Button } from "@/components/ui/button";
import { ToolbarHelpTooltip } from "@/components/ToolbarHelpTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useRouteChangeFocus } from "@/hooks/useRouteChangeFocus";
import type { HelpTabId } from "@/components/HelpPanel";

const OnboardingTour = dynamic(
  () => import("@/components/OnboardingTour").then((module) => module.OnboardingTour),
  { ssr: false },
);

const BuyerCtoDemoTourOverlay = dynamic(
  () => import("@/components/BuyerCtoDemoTourOverlay").then((module) => module.BuyerCtoDemoTourOverlay),
  { ssr: false },
);

const CtoDemoSpotlightOverlay = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoSpotlightOverlay").then(
      (module) => module.CtoDemoSpotlightOverlay,
    ),
  { ssr: false },
);

const HelpSearchPanel = dynamic(
  () => import("@/components/HelpSearchPanel").then((module) => module.HelpSearchPanel),
  { ssr: false },
);

const HelpPanel = dynamic(
  () => import("@/components/HelpPanel").then((module) => module.HelpPanel),
  { ssr: false },
);

const CorePilotWizardLauncher = dynamic(
  () => import("@/components/CorePilotWizard").then((module) => module.CorePilotWizardLauncher),
  { ssr: false },
);

const PilotBaselineWizardLauncher = dynamic(
  () =>
    import("@/components/PilotBaselineWizardLauncher").then(
      (module) => module.PilotBaselineWizardLauncher,
    ),
  { ssr: false },
);

const SidebarNav = dynamic(
  () => import("@/components/SidebarNav").then((module) => module.SidebarNav),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[12rem] animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800"
        aria-hidden
      />
    ),
  },
);

const AppShellStatusBanners = dynamic(
  () => import("@/components/shell/AppShellStatusBanners").then((module) => module.AppShellStatusBanners),
  { ssr: false },
);

const TrialLimitModalHost = dynamic(
  () => import("@/components/TrialLimitModal").then((module) => module.TrialLimitModalHost),
  { ssr: false },
);

const RegistrationOnboardingTourAutoStart = dynamic(
  () =>
    import("@/components/usability/RegistrationOnboardingTourAutoStart").then(
      (module) => module.RegistrationOnboardingTourAutoStart,
    ),
  { ssr: false },
);

const CtoDemoJourneyCaptionBar = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoJourneyCaptionBar").then(
      (module) => module.CtoDemoJourneyCaptionBar,
    ),
  { ssr: false },
);

const CtoDemoOfflineAutoFallbackListener = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoOfflineAutoFallbackListener").then(
      (module) => module.CtoDemoOfflineAutoFallbackListener,
    ),
  { ssr: false },
);

const CtoDemoPanicModeBanner = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoPanicModeBanner").then(
      (module) => module.CtoDemoPanicModeBanner,
    ),
  { ssr: false },
);

type AppShellHelpOverlaysProps = {
  helpDocSearchOpen: boolean;
  helpGuidesOpen: boolean;
  helpGuidesInitialTab: HelpTabId;
  onHelpDocSearchOpenChange: (open: boolean) => void;
  onHelpGuidesOpenChange: (open: boolean) => void;
  onOpenGuidesPanel: (initialTab?: HelpTabId) => void;
};

/** Defers help panel chunks until the operator first opens search or guides. */
function AppShellHelpOverlays({
  helpDocSearchOpen,
  helpGuidesOpen,
  helpGuidesInitialTab,
  onHelpDocSearchOpenChange,
  onHelpGuidesOpenChange,
  onOpenGuidesPanel,
}: AppShellHelpOverlaysProps) {
  const [searchMounted, setSearchMounted] = useState(false);
  const [guidesMounted, setGuidesMounted] = useState(false);

  useEffect(() => {
    if (helpDocSearchOpen) {
      setSearchMounted(true);
    }
  }, [helpDocSearchOpen]);

  useEffect(() => {
    if (helpGuidesOpen) {
      setGuidesMounted(true);
    }
  }, [helpGuidesOpen]);

  const handleOpenGuidesPanel = useCallback(
    (initialTab?: HelpTabId) => {
      setGuidesMounted(true);
      onOpenGuidesPanel(initialTab);
    },
    [onOpenGuidesPanel],
  );

  return (
    <>
      {searchMounted ? (
        <HelpSearchPanel
          open={helpDocSearchOpen}
          onOpenChange={onHelpDocSearchOpenChange}
          onOpenGuidesPanel={handleOpenGuidesPanel}
        />
      ) : null}
      {guidesMounted ? (
        <HelpPanel
          open={helpGuidesOpen}
          onOpenChange={onHelpGuidesOpenChange}
          initialTab={helpGuidesInitialTab}
        />
      ) : null}
    </>
  );
}

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
    <OperatorQueryProvider>
      <OperatorChromeModeProvider>
        <AppShellInner>{children}</AppShellInner>
      </OperatorChromeModeProvider>
    </OperatorQueryProvider>
  );
}

function AppShellInner({ children }: AppShellClientProps) {
  const pathname = usePathname();
  const chromeMode = useOperatorChromeMode();
  const [helpGuidesOpen, setHelpGuidesOpen] = useState(false);
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>("guides");
  const [helpDocSearchOpen, setHelpDocSearchOpen] = useState(false);
  const openHelpSearch = useCallback(() => {
    setHelpDocSearchOpen(true);
  }, []);
  const openHelpGuidesPanel = useCallback((initialTab: HelpTabId = "guides") => {
    setHelpGuidesInitialTab(initialTab);
    setHelpGuidesOpen(true);
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
          <ArchLucidWordmarkLink
            href="/"
            aria-label="ArchLucid"
            variant="operator"
            logoVariant="full"
          />
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
          <AppInsightsTelemetryInit />
          <SessionIdleTimeoutGuard />
          <UserAppearancePreferenceSync />
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
                          <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to workspace overview" variant="operator" />
                        </Button>
                      </h1>
                      <Link
                        href="/reviews?projectId=default"
                        className={cn("font-semibold text-teal-800 underline underline-offset-2 dark:text-teal-300", OPERATOR_TYPOGRAPHY.cardTitle)}
                      >
                        Reviews
                      </Link>
                      <Link
                        href="/"
                        className={cn("font-medium text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
                      >
                        {OPERATOR_NAV_LINK_LABELS.home}
                      </Link>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <AuthPanel />
                      <ToolbarHelpTooltip
                        aria-label={OPERATOR_HELP_ARIA_LABEL}
                        content={OPERATOR_HELP_TOOLTIP}
                        aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="inline-flex h-7 w-7 items-center justify-center p-0"
                          data-help-tooltip-trigger=""
                          data-help-tooltip-icon="help"
                          aria-label={OPERATOR_HELP_ARIA_LABEL}
                          aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
                          onClick={() => {
                            openHelpSearch();
                          }}
                        >
                          <CircleHelp className="size-[18px]" aria-hidden />
                        </Button>
                      </ToolbarHelpTooltip>
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
                <AppShellStatusBanners variant="minimal" />
                <KeyboardShortcutProvider onHelpRequested={openHelpSearch}>
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                  >
                    <SyncActiveRunFromPathname />
                    <DemoStrictNavigationGate>
                      <SponsorExecutiveShellRedirect>
                        <OperatorRoleGate>{children}</OperatorRoleGate>
                      </SponsorExecutiveShellRedirect>
                    </DemoStrictNavigationGate>
                  </main>
                </KeyboardShortcutProvider>
              </div>
            </div>
            <AppToaster />
            <RouteAnnouncer />
            <TrialLimitModalHost />
            <AppShellHelpOverlays
              helpDocSearchOpen={helpDocSearchOpen}
              helpGuidesOpen={helpGuidesOpen}
              helpGuidesInitialTab={helpGuidesInitialTab}
              onHelpDocSearchOpenChange={setHelpDocSearchOpen}
              onHelpGuidesOpenChange={setHelpGuidesOpen}
              onOpenGuidesPanel={openHelpGuidesPanel}
            />
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
      <UserAppearancePreferenceSync />
      <TooltipProvider delayDuration={200}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div ref={shellRootRef} className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-50 dark:bg-neutral-950">
          <div className="sticky top-0 z-30 overflow-x-hidden bg-neutral-50 shadow-sm dark:bg-neutral-950 print:hidden">
            <FrictionlessTrialBanner />
            <OperatorShellTopBar onOpenHelpSearch={openHelpSearch} />
            <LayerContextFromRoute />
            <CtoDemoJourneyCaptionBar />
          </div>
          <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex flex-1")}>
            <nav
              data-testid="sidebar-nav"
              aria-label="Primary navigation"
              className={cn(
                "hidden shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50/80 px-2 py-4 print:!hidden dark:border-neutral-800 dark:bg-neutral-950/80 lg:block",
                OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS,
              )}
            >
              <SidebarNav />
            </nav>
            <div data-testid="app-shell-main" className="min-w-0 flex-1 px-4 py-4 print:px-0 lg:px-6 lg:py-6">
              <AppShellStatusBanners variant="full" />
              <KeyboardShortcutProvider onHelpRequested={openHelpSearch}>
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                    <AppShellMainAffordances />
                    <SyncActiveRunFromPathname />
                    <DemoStrictNavigationGate>
                      <SponsorExecutiveShellRedirect>
                        <OperatorRoleGate>{children}</OperatorRoleGate>
                      </SponsorExecutiveShellRedirect>
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
              <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex items-center px-4 lg:px-6")}>
                <SystemHealthStatusStrip className="mb-0 min-w-0 flex-1" />
              </div>
            </footer>
          ) : null}
        </div>
        <AppToaster />
        <RouteAnnouncer />
        <TrialLimitModalHost />
        <AppShellHelpOverlays
          helpDocSearchOpen={helpDocSearchOpen}
          helpGuidesOpen={helpGuidesOpen}
          helpGuidesInitialTab={helpGuidesInitialTab}
          onHelpDocSearchOpenChange={setHelpDocSearchOpen}
          onHelpGuidesOpenChange={setHelpGuidesOpen}
          onOpenGuidesPanel={openHelpGuidesPanel}
        />
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
