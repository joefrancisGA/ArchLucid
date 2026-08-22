"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode, type RefObject } from "react";

import { usePathname, useRouter } from "next/navigation";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { OperatorShellStatusQueryGate } from "@/components/shell/OperatorShellStatusQueryGate";
import {
  AppShellIdleOverlaysDeferred,
  AppShellKeyboardShortcutBoundaryDeferred,
  AppShellMainAffordancesDeferred,
  AppShellMainContentGateDeferred,
  AppShellStatusBannersDeferred,
  AppShellTelemetryBundleDeferred,
  AppShellWorkspaceFooterDeferred,
  AppToasterDeferred,
  AuthPanelDeferred,
  AuthorityThemeToggleDeferred,
  ColorModeToggleDeferred,
  CtoDemoJourneyCaptionBarDeferred,
  DevTestingShellShortcutsDeferred,
  FrictionlessTrialBannerDeferred,
  HelpPanelDeferred,
  HelpSearchPanelDeferred,
  OnboardingTourDeferred,
  OperatorShellAccessRedirectsHostDeferred,
  OperatorShellTopBarDeferred,
  RegistrationOnboardingTourAutoStartDeferred,
  RouteAnnouncerDeferred,
  SessionIdleTimeoutGuardDeferred,
  ShellThemePreferencesAppearanceVocabularyRailDeferred,
  SidebarNavDeferred,
  SyncActiveRunFromPathnameDeferred,
  TrialLimitModalHostDeferred,
} from "@/components/shell/app-shell-deferred-chunks";
import {
  OperatorChromeModeProvider,
  useOperatorChromeMode,
} from "@/components/operator/OperatorChromeModeContext";
import { OperatorShellProviders } from "@/components/operator/OperatorShellProviders";
import { OperatorShellDeferredChrome } from "@/components/operator/OperatorShellDeferredChrome";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { Button } from "@/components/ui/button";
import { ToolbarHelpTooltip } from "@/components/ToolbarHelpTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import {
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance/governance-route-paths";
import {
  OPERATOR_LINK,
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
import { resolveOperatorHelpRequestForPathname } from "@/lib/usability/resolve-operator-help-request";

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
        <HelpSearchPanelDeferred
          open={helpDocSearchOpen}
          onOpenChange={onHelpDocSearchOpenChange}
          onOpenGuidesPanel={handleOpenGuidesPanel}
        />
      ) : null}
      {guidesMounted ? (
        <HelpPanelDeferred
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
      <OperatorShellStatusQueryGate>
        <OperatorChromeModeProvider>
          <AppShellInner>{children}</AppShellInner>
        </OperatorChromeModeProvider>
      </OperatorShellStatusQueryGate>
    </OperatorQueryProvider>
  );
}

function AppShellInner({ children }: AppShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const chromeMode = useOperatorChromeMode();
  const deferChrome = useOperatorShellChromeDeferred();
  const [helpGuidesOpen, setHelpGuidesOpen] = useState(false);
  const [helpGuidesInitialTab, setHelpGuidesInitialTab] = useState<HelpTabId>("guides");
  const [helpDocSearchOpen, setHelpDocSearchOpen] = useState(false);
  const openHelpSearch = useCallback(() => {
    const request = resolveOperatorHelpRequestForPathname(pathname ?? "/");

    if (request.kind === "navigate") {
      router.push(request.href);
      return;
    }

    setHelpDocSearchOpen(true);
  }, [pathname, router]);
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
        className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-6 dark:bg-neutral-950 sm:py-8"
      >
        {isAccessDeniedRoute ? (
          <div className="mb-6">
            <ArchLucidWordmarkLink
              href="/"
              aria-label="ArchLucid"
              variant="operator"
              logoVariant="full"
            />
          </div>
        ) : null}
        <div className="w-full max-w-[520px]">
          {surfaceChildren}
        </div>
        <AppToasterDeferred />
        <RouteAnnouncerDeferred />
      </div>
    );
  }

  if (chromeMode === "minimal") {
    return (
      <OperatorShellProviders>
        <AppShellDeferChromeBoundary deferChrome={deferChrome} shellRootRef={shellRootRef}>
          {!deferChrome ? <OperatorShellAccessRedirectsHostDeferred /> : null}
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
                        <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to workspace overview" variant="operator" />
                      </h1>
                      <Link
                        href="/architecture/reviews"
                        className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.cardTitle)}
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
                      {isUiAuthorityThemeEvalEnabledEnv() ? <AuthorityThemeToggleDeferred /> : null}
                      <div className="relative flex items-center" data-testid="shell-theme-toggle-cluster">
                        <ColorModeToggleDeferred />
                        {/* Sticky chrome stays one-row; teaching stays available to AT and tests. */}
                        <ShellThemePreferencesAppearanceVocabularyRailDeferred
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
                <AppShellStatusBannersDeferred variant="minimal" />
                <AppShellKeyboardShortcutBoundaryDeferred onHelpRequested={openHelpSearch}>
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                  >
                    <SyncActiveRunFromPathnameDeferred />
                    <AppShellMainContentGateDeferred>{children}</AppShellMainContentGateDeferred>
                  </main>
                </AppShellKeyboardShortcutBoundaryDeferred>
              </div>
            </div>
            <AppToasterDeferred />
            <RouteAnnouncerDeferred />
            <TrialLimitModalHostDeferred />
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
      {!deferChrome ? <OperatorShellAccessRedirectsHostDeferred /> : null}
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
            <FrictionlessTrialBannerDeferred />
            <OperatorShellTopBarDeferred onOpenHelpSearch={openHelpSearch} />
          </div>
          <CtoDemoJourneyCaptionBarDeferred />
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
              <SidebarNavDeferred />
            </nav>
            <div
              data-testid="app-shell-main"
              className={cn("flex min-h-0 min-w-0 flex-1 flex-col print:px-0", OPERATOR_SHELL_MAIN_PADDING_CLASS)}
            >
              <AppShellStatusBannersDeferred variant="full" />
              <AppShellKeyboardShortcutBoundaryDeferred onHelpRequested={openHelpSearch}>
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                  <AppShellMainAffordancesDeferred />
                  <SyncActiveRunFromPathnameDeferred />
                  <AppShellMainContentGateDeferred>{children}</AppShellMainContentGateDeferred>
                </main>
              </AppShellKeyboardShortcutBoundaryDeferred>
            </div>
          </div>
          <div className="mt-auto shrink-0">
            <AppShellWorkspaceFooterDeferred hideWorkspaceHealthFooter={hideWorkspaceHealthFooter} />
          </div>
        </div>
        <AppToasterDeferred />
        <RouteAnnouncerDeferred />
        <TrialLimitModalHostDeferred />
        <AppShellHelpOverlays
          helpDocSearchOpen={helpDocSearchOpen}
          helpGuidesOpen={helpGuidesOpen}
          helpGuidesInitialTab={helpGuidesInitialTab}
          onHelpDocSearchOpenChange={setHelpDocSearchOpen}
          onHelpGuidesOpenChange={setHelpGuidesOpen}
          onOpenGuidesPanel={openHelpGuidesPanel}
        />
        <OnboardingTourDeferred />
        <Suspense fallback={null}>
          <RegistrationOnboardingTourAutoStartDeferred />
        </Suspense>
        <AppShellIdleOverlaysDeferred />
      </TooltipProvider>
      </AppShellDeferChromeBoundary>
    </OperatorShellProviders>
  );
}
