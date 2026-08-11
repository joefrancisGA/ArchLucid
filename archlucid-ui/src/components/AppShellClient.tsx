"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode, type RefObject } from "react";

import { usePathname } from "next/navigation";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AppToaster } from "@/components/AppToaster";
import { OperatorQueryProvider } from "@/components/OperatorQueryProvider";
import {
  AppShellIdleOverlaysDeferred,
  AppShellMainContentGateDeferred,
  AppShellTelemetryBundleDeferred,
  AppShellWorkspaceFooterDeferred,
  AuthPanelDeferred,
  DevTestingShellShortcutsDeferred,
  OperatorShellTopBarDeferred,
  SessionIdleTimeoutGuardDeferred,
  SyncActiveRunFromPathnameDeferred,
} from "@/components/shell/app-shell-deferred-chunks";
import { AppShellKeyboardShortcutBoundary } from "@/components/shell/AppShellKeyboardShortcutBoundary";
import { OperatorShellAccessRedirectsHost } from "@/components/shell/OperatorShellAccessRedirectsHost";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import {
  OperatorChromeModeProvider,
  useOperatorChromeMode,
} from "@/components/OperatorChromeModeContext";
import { OperatorShellProviders } from "@/components/OperatorShellProviders";
import { OperatorShellDeferredChrome } from "@/components/OperatorShellDeferredChrome";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { Button } from "@/components/ui/button";
import { ToolbarHelpTooltip } from "@/components/ToolbarHelpTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import {
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance-route-paths";
import {
  OPERATOR_SHELL_BODY_ROW_CLASS,
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAIN_PADDING_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_SHELL_SIDEBAR_PADDING_CLASS,
  OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useAppShellStickyOffsetSync } from "@/hooks/useAppShellStickyOffsetSync";
import { useOperatorShellChromeDeferred } from "@/hooks/useOperatorShellChromeDeferred";
import { useRouteChangeFocus } from "@/hooks/useRouteChangeFocus";
import type { HelpTabId } from "@/components/HelpPanel";

const FrictionlessTrialBanner = dynamic(
  () =>
    import("@/components/FrictionlessTrialBanner").then(
      (module) => module.FrictionlessTrialBanner,
    ),
  { ssr: false },
);

const AppShellMainAffordances = dynamic(
  () =>
    import("@/components/shell/AppShellMainAffordances").then(
      (module) => module.AppShellMainAffordances,
    ),
  { ssr: false, loading: () => null },
);

const OnboardingTour = dynamic(
  () => import("@/components/OnboardingTour").then((module) => module.OnboardingTour),
  { ssr: false },
);

const RegistrationOnboardingTourAutoStart = dynamic(
  () =>
    import("@/components/usability/RegistrationOnboardingTourAutoStart").then(
      (module) => module.RegistrationOnboardingTourAutoStart,
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

const CtoDemoJourneyCaptionBar = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoJourneyCaptionBar").then(
      (module) => module.CtoDemoJourneyCaptionBar,
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

function AppShellDeferChromeBoundary({
  shellRootRef,
  deferChrome,
  children,
}: {
  shellRootRef: RefObject<HTMLDivElement | null>;
  deferChrome: boolean;
  children: ReactNode;
}) {
  if (deferChrome) {
    return <OperatorShellDeferredChrome shellRootRef={shellRootRef} />;
  }

  return <>{children}</>;
}

/**
 * Operator shell: sticky header rail (logo, auth/environment, scope, global search, help, theme),
 * collapsible sidebar nav landmark (lg+), mobile drawer, keyboard shortcuts, and primary <main> landmark.
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
  const deferChrome = useOperatorShellChromeDeferred();
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
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  useAppShellStickyOffsetSync(stickyHeaderRef);
  useRouteChangeFocus("main-content");

  /** Omit platform readiness on operator home — avoids “Healthy” next to an empty or fragile demo workspace story. */
  const hideWorkspaceHealthFooter =
    pathname === "/" ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/insights/evidence-graph") ||
    pathname.startsWith("/insights/ask-review-questions") ||
    pathname.startsWith("/governance") ||
    pathMatchesGovernanceAudit(pathname) ||
    pathMatchesGovernanceAlerts(pathname) ||
    pathMatchesGovernancePolicyPacks(pathname) ||
    (pathname.startsWith("/architecture/reviews/") && pathname.split("/").filter(Boolean).length >= 2);

  /** Auth and access-denied pages render without nav/workspace chrome to avoid confusion. */
  const isAuthRoute = pathname.startsWith("/auth/");
  const isAccessDeniedRoute = pathname === "/403";
  const isStandaloneAccessSurface = isAuthRoute || isAccessDeniedRoute;

  /**
   * `useLayoutEffect`: runs before paint so Playwright sees the marker as soon as the shell DOM commits.
   * Re-run when deferred access-gate chrome swaps to full shell — `shellRootRef` moves to a new node (TB-730).
   */
  useLayoutEffect(() => {
    shellRootRef.current?.setAttribute("data-app-ready", "true");
  }, [pathname, chromeMode, isStandaloneAccessSurface, deferChrome]);

  if (isStandaloneAccessSurface) {
    const surfaceChildren = isAccessDeniedRoute ? (
      <OperatorShellProviders>{children}</OperatorShellProviders>
    ) : (
      children
    );

    return (
      <div
        ref={shellRootRef}
        className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950 sm:py-16"
      >
        <div className="mb-8">
          <ArchLucidWordmarkLink
            href="/"
            aria-label="ArchLucid"
            variant="operator"
            logoVariant="full"
          />
        </div>
        <div className="w-full max-w-[560px]">
          {surfaceChildren}
        </div>
        <AppToaster />
        <RouteAnnouncer />
      </div>
    );
  }

  if (chromeMode === "minimal") {
    return (
      <OperatorShellProviders>
        <AppShellDeferChromeBoundary deferChrome={deferChrome} shellRootRef={shellRootRef}>
          {!deferChrome ? <OperatorShellAccessRedirectsHost /> : null}
          <AppShellTelemetryBundleDeferred />
          <SessionIdleTimeoutGuardDeferred />
          <TooltipProvider delayDuration={200}>
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            <div
              ref={shellRootRef}
              key={chromeMode}
              data-testid="app-shell-minimal-root"
              className="flex min-h-dvh flex-col bg-neutral-50 dark:bg-neutral-950"
            >
              <div ref={stickyHeaderRef} className="sticky top-0 z-30 bg-neutral-50 shadow-sm dark:bg-neutral-950 print:hidden">
                <header
                  data-testid="app-shell-minimal-topbar"
                  className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, "flex flex-wrap items-center justify-between gap-3 py-2.5")}>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                      <h1 className="m-0">
                        <Button variant="outline" className="h-auto p-0" asChild>
                          <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to workspace overview" variant="operator" />
                        </Button>
                      </h1>
                      <Link
                        href="/architecture/reviews"
                        className={cn("font-semibold text-teal-800 underline underline-offset-2 dark:text-teal-300", OPERATOR_TYPOGRAPHY.cardTitle)}
                      >
                        Reviews
                      </Link>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <AuthPanelDeferred />
                      <ToolbarHelpTooltip
                        aria-label={OPERATOR_HELP_ARIA_LABEL}
                        content={OPERATOR_HELP_TOOLTIP}
                        aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
                      >
                        <Button
                          type="button"
                          variant="outline"
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
                      <div className="relative flex items-center" data-testid="shell-theme-toggle-cluster">
                        <ColorModeToggle />
                        {/* Sticky chrome stays one-row; teaching stays available to AT and tests. */}
                        <ShellThemePreferencesAppearanceVocabularyRail
                          currentSurfaceId="shell-theme-toggle"
                          className="sr-only"
                        />
                      </div>
                    </div>
                  </div>
                </header>
              </div>
              <div
                data-testid="app-shell-main"
                className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_MAIN_PADDING_CLASS, "flex flex-1 flex-col")}
              >
                <AppShellStatusBanners variant="minimal" />
                <AppShellKeyboardShortcutBoundary onHelpRequested={openHelpSearch}>
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                  >
                    <SyncActiveRunFromPathnameDeferred />
                    <AppShellMainContentGateDeferred>{children}</AppShellMainContentGateDeferred>
                  </main>
                </AppShellKeyboardShortcutBoundary>
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
        </AppShellDeferChromeBoundary>
      </OperatorShellProviders>
    );
  }

  return (
    <OperatorShellProviders>
      <AppShellDeferChromeBoundary deferChrome={deferChrome} shellRootRef={shellRootRef}>
      {!deferChrome ? <OperatorShellAccessRedirectsHost /> : null}
      <AppShellTelemetryBundleDeferred />
      <DevTestingShellShortcutsDeferred />
      <SessionIdleTimeoutGuardDeferred />
      <TooltipProvider delayDuration={200}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div ref={shellRootRef} key={chromeMode} className="flex min-h-dvh flex-col overflow-x-hidden bg-neutral-50 dark:bg-neutral-950">
          {/* Sticky budget: optional trial strip + one-row top bar only. Journey caption scrolls with the page. */}
          <div
            ref={stickyHeaderRef}
            data-testid="app-shell-sticky-header"
            className="sticky top-0 z-30 bg-neutral-50 shadow-sm dark:bg-neutral-950 print:hidden"
          >
            <FrictionlessTrialBanner />
            <OperatorShellTopBarDeferred onOpenHelpSearch={openHelpSearch} />
          </div>
          <CtoDemoJourneyCaptionBar />
          <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_BODY_ROW_CLASS, "flex-1")}>
            <nav
              data-testid="sidebar-nav"
              aria-label="Primary navigation"
              className={cn(
                "hidden shrink-0 self-stretch overflow-y-auto border-r border-neutral-200 bg-neutral-50/80 print:!hidden dark:border-neutral-800 dark:bg-neutral-950/80 lg:block",
                OPERATOR_SHELL_SIDEBAR_PADDING_CLASS,
                OPERATOR_SHELL_SIDEBAR_WIDTH_CLASS,
              )}
            >
              <SidebarNav />
            </nav>
            <div
              data-testid="app-shell-main"
              className={cn("flex min-h-0 min-w-0 flex-1 flex-col print:px-0", OPERATOR_SHELL_MAIN_PADDING_CLASS)}
            >
              <AppShellStatusBanners variant="full" />
              <AppShellKeyboardShortcutBoundary onHelpRequested={openHelpSearch}>
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                  <AppShellMainAffordances />
                  <SyncActiveRunFromPathnameDeferred />
                  <AppShellMainContentGateDeferred>{children}</AppShellMainContentGateDeferred>
                </main>
              </AppShellKeyboardShortcutBoundary>
            </div>
          </div>
          <div className="mt-auto shrink-0">
            <AppShellWorkspaceFooterDeferred hideWorkspaceHealthFooter={hideWorkspaceHealthFooter} />
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
        <OnboardingTour />
        <Suspense fallback={null}>
          <RegistrationOnboardingTourAutoStart />
        </Suspense>
        <AppShellIdleOverlaysDeferred />
      </TooltipProvider>
      </AppShellDeferChromeBoundary>
    </OperatorShellProviders>
  );
}
