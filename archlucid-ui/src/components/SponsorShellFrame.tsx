"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { SponsorShellDeferredChrome } from "@/components/sponsor/SponsorShellDeferredChrome";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import { ShellReadySurface } from "@/components/ShellReadySurface";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SPONSOR_DASHBOARD_HREF,
  isSponsorDashboardPath,
} from "@/lib/sponsor/sponsor-dashboard-route";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAIN_PADDING_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { PERSONA_SHELL_WORKSPACE_LABEL } from "@/lib/vocabulary/persona-shell-vocabulary";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";

export type SponsorShellFrameProps = {
  children: ReactNode;
};

/**
 * Minimal authenticated chrome for the sponsor route group: wordmark, nav, scope, auth — no sidebar.
 */
function executiveNavLinkClassName(isActive: boolean): string {
  const base = "shrink-0 text-neutral-700 dark:text-neutral-300";

  if (!isActive) {
    return base;
  }

  return `${base} font-semibold underline underline-offset-4`;
}

function isSponsorDashboardNavActive(pathname: string): boolean {
  return isSponsorDashboardPath(pathname);
}

export function SponsorShellFrame({ children }: SponsorShellFrameProps) {
  const pathname = usePathname();

  return (
    <OperatorQueryProvider>
      <TooltipProvider delayDuration={200}>
        <ShellReadySurface className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <header
          data-testid="sponsor-shell-topbar"
          className="overflow-x-hidden border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
        >
          <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, "flex flex-wrap items-center justify-between gap-3 py-2.5")}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ArchLucidWordmarkLink
                href={SPONSOR_DASHBOARD_HREF}
                aria-label="ArchLucid — sponsor dashboard"
                variant="operator"
              />
              <Button
                asChild
                variant="outline"
                size="sm"
                className={executiveNavLinkClassName(isSponsorDashboardNavActive(pathname))}
              >
                <Link href={SPONSOR_DASHBOARD_HREF} data-testid="sponsor-shell-nav-dashboard">
                  Dashboard
                </Link>
              </Button>
            </div>
            <div
              data-testid="sponsor-shell-topbar-session"
              className="flex min-w-0 flex-wrap items-center justify-end gap-2"
            >
              <Button asChild variant="outline" size="sm" className="shrink-0 text-neutral-700 dark:text-neutral-300">
                <Link href="/" data-testid="sponsor-shell-architect-workspace-link">
                  {PERSONA_SHELL_WORKSPACE_LABEL}
                </Link>
              </Button>
              <ScopeSwitcher density="compact" />
              <AuthPanel />
              {isUiAuthorityThemeEvalEnabledEnv() ? <AuthorityThemeToggle /> : null}
            </div>
          </div>
        </header>
        <SponsorShellDeferredChrome />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            OPERATOR_SHELL_MAX_WIDTH_CLASS,
            OPERATOR_SHELL_MAIN_PADDING_CLASS,
            "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600",
          )}
        >
          {children}
        </main>
      </ShellReadySurface>
    </TooltipProvider>
    </OperatorQueryProvider>
  );
}
