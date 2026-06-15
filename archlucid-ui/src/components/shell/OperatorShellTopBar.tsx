"use client";

import { CircleHelp } from "lucide-react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { LlmBudgetStatusPill } from "@/components/LlmBudgetStatusPill";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExecutiveOperatorShellSwitcher } from "@/components/usability/ExecutiveOperatorShellSwitcher";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";

type OperatorShellTopBarProps = {
  readonly onOpenHelpSearch: () => void;
};

/**
 * Operator shell header: single primary rail (identity, search, session controls, help).
 */
export function OperatorShellTopBar(props: OperatorShellTopBarProps): React.JSX.Element {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const showDevOperatorChrome = !buyerPolished;
  const showAuthorityThemeToggle = isUiAuthorityThemeEvalEnabledEnv();

  return (
    <header
      data-testid="app-shell-topbar"
      className="overflow-x-hidden border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden px-4 py-2.5 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <div
            data-testid="app-shell-topbar-primary"
            className="flex min-w-0 items-center gap-3"
          >
            <MobileNavDrawer />
            <h1 className="m-0">
              <Button variant="ghost" className="h-auto p-0" asChild>
                <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to operator home" variant="operator" />
              </Button>
            </h1>
          </div>

          <div className="min-w-0 flex-1 basis-full sm:order-none sm:basis-auto sm:max-w-md lg:max-w-sm xl:max-w-md">
            <GlobalSearchBar />
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:ml-auto">
            {showDevOperatorChrome ? <LlmBudgetStatusPill /> : null}
            <ExecutiveOperatorShellSwitcher />
            <AuthPanel />
            <ScopeSwitcher density="compact" />
            <div className="flex items-center gap-2 border-l border-neutral-200 pl-2 dark:border-neutral-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    data-testid="operator-shell-help-trigger"
                    aria-label="Help and documentation"
                    onClick={() => {
                      props.onOpenHelpSearch();
                    }}
                  >
                    <CircleHelp className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Help and documentation</TooltipContent>
              </Tooltip>
              {showAuthorityThemeToggle ? <AuthorityThemeToggle /> : null}
              <ColorModeToggle />
            </div>
          </div>
        </div>
      </div>
      <CommandPalette />
    </header>
  );
}
