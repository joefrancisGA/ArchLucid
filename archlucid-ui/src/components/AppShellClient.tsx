"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AppToaster } from "@/components/AppToaster";
import { AuthPanel } from "@/components/AuthPanel";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { HelpPanel } from "@/components/HelpPanel";
import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import { KeyboardShortcutProvider } from "@/components/KeyboardShortcutProvider";
import { LayerContextFromRoute } from "@/components/LayerContextFromRoute";
import { CorePilotWizardLauncher } from "@/components/CorePilotWizard";
import { DemoStrictNavigationGate } from "@/components/DemoStrictNavigationGate";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import {
  OperatorChromeModeProvider,
  useOperatorChromeMode,
} from "@/components/OperatorChromeModeContext";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import { OperatorNavAuthorityProvider } from "@/components/OperatorNavAuthorityProvider";
import { SidebarNav } from "@/components/SidebarNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { SyncActiveRunFromPathname } from "@/components/SyncActiveRunFromPathname";
import { WorkspaceActiveRunProvider } from "@/components/WorkspaceActiveRunContext";
import { SystemHealthStatusStrip } from "@/components/operator-home/SystemHealthStatusStrip";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { TrialBanner } from "@/components/TrialBanner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouteChangeFocus } from "@/hooks/useRouteChangeFocus";

type AppShellClientProps = {
  children: ReactNode;
};

/**
 * Operator shell: sticky header (logo, auth/environment, scope, command palette, help, theme), breadcrumbs,
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
              <header
                data-testid="app-shell-minimal-topbar"
                className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur print:hidden dark:border-neutral-700 dark:bg-neutral-950/95"
              >
                <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="Open documentation search"
                      onClick={() => {
                        setHelpDocSearchOpen(true);
                      }}
                    >
                      <HelpCircle className="h-4 w-4" aria-hidden />
                    </Button>
                    <ColorModeToggle />
                  </div>
                </div>
              </header>
              <LayerContextFromRoute />
              <div data-testid="app-shell-main" className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
                <KeyboardShortcutProvider
                  onHelpRequested={() => {
                    setHelpDocSearchOpen(true);
                  }}
                >
                  <main
                    id="main-content"
                    tabIndex={-1}
                    className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                  >
                    <SyncActiveRunFromPathname />
                    <DemoStrictNavigationGate />
                    {children}
                  </main>
                </KeyboardShortcutProvider>
              </div>
            </div>
            <AppToaster />
            <RouteAnnouncer />
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
      <TooltipProvider delayDuration={200}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <div ref={shellRootRef} className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
          <header data-testid="app-shell-topbar" className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur print:hidden dark:border-neutral-700 dark:bg-neutral-950/95">
            <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 lg:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MobileNavDrawer />
                <h1 className="m-0">
                  <Button variant="ghost" className="h-auto p-0" asChild>
                    <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to operator home" variant="operator" />
                  </Button>
                </h1>
                <div className="hidden min-w-0 flex-1 items-center gap-1.5 pl-2 lg:flex">
                  <Breadcrumbs />
                </div>
              </div>
              <div className="flex max-w-[min(100%,42rem)] shrink-0 flex-wrap items-center justify-end gap-2">
                <AuthPanel />
                <ScopeSwitcher />
                <CommandPalette />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Open documentation search"
                  onClick={() => {
                    setHelpDocSearchOpen(true);
                  }}
                >
                  <HelpCircle className="h-4 w-4" aria-hidden />
                </Button>
                <ColorModeToggle />
              </div>
            </div>
          </header>
          <LayerContextFromRoute />
          <div className="mx-auto flex w-full max-w-[1600px] flex-1">
            <nav
              data-testid="sidebar-nav"
              aria-label="Primary"
              className="hidden w-[15.5rem] shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50/80 px-2 py-4 print:!hidden dark:border-neutral-800 dark:bg-neutral-950/80 lg:block"
            >
              <SidebarNav />
            </nav>
            <div data-testid="app-shell-main" className="min-w-0 flex-1 px-4 py-4 print:px-0 lg:px-6 lg:py-6">
              {pathname === "/" ? <TrialBanner /> : null}
              <KeyboardShortcutProvider
                onHelpRequested={() => {
                  setHelpDocSearchOpen(true);
                }}
              >
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                    <SyncActiveRunFromPathname />
                    <DemoStrictNavigationGate />
                    {children}
                </main>
              </KeyboardShortcutProvider>
            </div>
          </div>
          {!isBuyerPolishedOperatorShellEnv() && !isNextPublicDemoMode() && !hideWorkspaceHealthFooter ? (
            <footer
              className="border-t border-neutral-200 bg-neutral-50/90 py-2 print:hidden dark:border-neutral-800 dark:bg-neutral-950/90"
              aria-label="Workspace footer"
            >
              <div className="mx-auto flex max-w-[1600px] items-center px-4 lg:px-6">
                <SystemHealthStatusStrip className="mb-0 w-full" />
              </div>
            </footer>
          ) : null}
        </div>
        <AppToaster />
        <RouteAnnouncer />
        <HelpSearchPanel
          open={helpDocSearchOpen}
          onOpenChange={setHelpDocSearchOpen}
          onOpenGuidesPanel={() => {
            setHelpGuidesOpen(true);
          }}
        />
        <HelpPanel open={helpGuidesOpen} onOpenChange={setHelpGuidesOpen} />
        <CorePilotWizardLauncher />
        <OnboardingTour />
      </TooltipProvider>
      </WorkspaceActiveRunProvider>
    </OperatorNavAuthorityProvider>
  );
}
