"use client";

import { CircleHelp } from "lucide-react";

import { ArchLucidWordmarkLink } from "@/components/ArchLucidWordmarkLink";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { LlmBudgetStatusPill } from "@/components/LlmBudgetStatusPill";
import { useSearchShortcut } from "@/hooks/useSearchShortcut";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { ScopeSwitcher } from "@/components/ScopeSwitcher";
import { Button } from "@/components/ui/button";
import { ToolbarHelpTooltip } from "@/components/ToolbarHelpTooltip";
import { ExecutiveOperatorShellSwitcher } from "@/components/usability/ExecutiveOperatorShellSwitcher";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import {
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS,
} from "@/lib/design-tokens";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { cn } from "@/lib/utils";

type OperatorShellTopBarProps = {
  readonly onOpenHelpSearch: () => void;
};

/**
 * Operator shell header: brand rail (sidebar width), content-aligned search, session controls.
 */
export function OperatorShellTopBar(props: OperatorShellTopBarProps): React.JSX.Element {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const showDevOperatorChrome = !buyerPolished;
  const showAuthorityThemeToggle = isUiAuthorityThemeEvalEnabledEnv();

  useSearchShortcut();

  return (
    <header
      data-testid="app-shell-topbar"
      className="overflow-x-hidden border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
    >
      <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "flex min-w-0 overflow-x-hidden")}>
        <div
          data-testid="app-shell-topbar-primary"
          className={cn(
            "flex min-w-0 shrink-0 items-center gap-3 px-4 py-2.5 lg:px-2",
            OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS,
          )}
        >
          <MobileNavDrawer />
          <h1 className="m-0">
            <Button variant="ghost" className="h-auto p-0" asChild>
              <ArchLucidWordmarkLink href="/" aria-label="ArchLucid — go to operator home" variant="operator" />
            </Button>
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-md lg:max-w-lg xl:max-w-xl">
            <GlobalSearchBar />
          </div>

          <div
            data-testid="app-shell-topbar-session"
            className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:ml-auto"
          >
            <div
              data-testid="app-shell-topbar-context"
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              <ScopeSwitcher density="compact" />
              <ExecutiveOperatorShellSwitcher />
            </div>
            <AuthPanel />
            <div className="flex items-center gap-2 border-l border-neutral-200 pl-2 dark:border-neutral-700">
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
                  data-testid="operator-shell-help-trigger"
                  data-help-tooltip-trigger=""
                  data-help-tooltip-icon="help"
                  aria-label={OPERATOR_HELP_ARIA_LABEL}
                  aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
                  onClick={() => {
                    props.onOpenHelpSearch();
                  }}
                >
                  <CircleHelp className="size-[18px]" aria-hidden />
                </Button>
              </ToolbarHelpTooltip>
              {showAuthorityThemeToggle ? <AuthorityThemeToggle /> : null}
              {showDevOperatorChrome ? <LlmBudgetStatusPill /> : null}
            </div>
          </div>
        </div>
      </div>
      <CommandPalette />
    </header>
  );
}
