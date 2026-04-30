"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AuthPanel } from "@/components/AuthPanel";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ShellReadySurface } from "@/components/ShellReadySurface";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export type ExecutiveShellFrameProps = {
  children: ReactNode;
};

/**
 * Minimal authenticated chrome for the executive route group: wordmark, operator link, auth, theme — no sidebar.
 */
export function ExecutiveShellFrame({ children }: ExecutiveShellFrameProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <ShellReadySurface className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <header
          data-testid="executive-shell-topbar"
          className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-950/95"
        >
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
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
              <span className="hidden text-neutral-400 sm:inline dark:text-neutral-600" aria-hidden>
                |
              </span>
              <Button asChild variant="ghost" size="sm" className="shrink-0 text-neutral-700 dark:text-neutral-300">
                <Link href="/">Operator shell</Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <AuthPanel />
              <ColorModeToggle />
            </div>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-4xl px-6 py-8 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
        >
          {children}
        </main>
      </ShellReadySurface>
    </TooltipProvider>
  );
}
