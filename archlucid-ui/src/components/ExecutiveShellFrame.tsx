"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ExecutiveShellOrientationCallout } from "@/components/executive/ExecutiveShellOrientationCallout";
import { LayerContextFromRoute } from "@/components/LayerContextFromRoute";
import { ShellReadySurface } from "@/components/ShellReadySurface";
import { TenantWorkspaceBoundaryBadge } from "@/components/shell/TenantWorkspaceBoundaryBadge";
import { ExecutiveOperatorShellSwitcher } from "@/components/usability/ExecutiveOperatorShellSwitcher";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";

export type ExecutiveShellFrameProps = {
  children: ReactNode;
};

/**
 * Minimal authenticated chrome for the executive route group: wordmark, operator link, auth, theme — no sidebar.
 */
function executiveNavLinkClassName(isActive: boolean): string {
  const base = "shrink-0 text-neutral-700 dark:text-neutral-300";

  if (!isActive) {
    return base;
  }

  return `${base} font-semibold underline underline-offset-4`;
}

export function ExecutiveShellFrame({ children }: ExecutiveShellFrameProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <ShellReadySurface className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <header
          data-testid="executive-shell-topbar"
          className="sticky top-0 z-30 overflow-x-hidden border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button variant="ghost" className="h-auto shrink-0 p-0" asChild>
                <ArchLucidWordmarkLink
                  href="/executive/reviews"
                  aria-label="ArchLucid — executive reviews"
                  variant="operator"
                />
              </Button>
              <Button asChild variant="ghost" size="sm" className="shrink-0 text-neutral-700 dark:text-neutral-300">
                <Link href="/executive/reviews">Risk reviews</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={executiveNavLinkClassName(
                  pathname === "/dashboard" || pathname.startsWith("/executive/dashboard"),
                )}
              >
                <Link href="/executive/dashboard" data-testid="executive-shell-nav-dashboard">
                  Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={executiveNavLinkClassName(pathname.startsWith("/executive/scorecard"))}
              >
                <Link href="/executive/scorecard" data-testid="executive-shell-nav-scorecard">
                  Scorecard
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <ExecutiveOperatorShellSwitcher />
              <TenantWorkspaceBoundaryBadge variant="compact" />
              <AuthPanel />
              {isUiAuthorityThemeEvalEnabledEnv() ? <AuthorityThemeToggle /> : null}
              <ColorModeToggle />
            </div>
          </div>
        </header>
        <ExecutiveShellOrientationCallout />
        <LayerContextFromRoute />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1600px] px-4 py-4 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600 lg:px-6 lg:py-6"
        >
          {children}
        </main>
      </ShellReadySurface>
    </TooltipProvider>
  );
}
