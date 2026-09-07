"use client";

import { CircleHelp } from "lucide-react";

import {
  AccountSettingsMenuDeferred,
  GlobalSearchBarDeferred,
  LlmBudgetStatusPillDeferred,
  MobileNavDrawerDeferred,
  OperatorShellTopBarMoreMenuDeferred,
  ScopeSwitcherDeferred,
  ShellInFlightOperationsAffordanceDeferred,
} from "@/components/shell/operator-shell-top-bar-deferred-chunks";
import { TenantMastheadWordmark } from "@/components/brand/TenantMastheadWordmark";
import { AuthPanel } from "@/components/AuthPanel";
import { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import { OperatorShellDemoWorkspaceTag } from "@/components/shell/OperatorShellDemoWorkspaceTag";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { GuidedModeTopBarChip } from "@/components/workspace-mode/GuidedModeTopBarChip";
import { SimulatorModeTopBarChip } from "@/components/usability/SimulatorModeTopBarChip";
import { useSearchShortcut } from "@/hooks/useSearchShortcut";
import { useReviewPresenterChromeActive } from "@/hooks/use-review-presenter-chrome-active";
import { Button } from "@/components/ui/button";
import { ToolbarHelpTooltip } from "@/components/ToolbarHelpTooltip";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_HELP_ARIA_KEYSHORTCUTS, OPERATOR_HELP_ARIA_LABEL, OPERATOR_HELP_TOOLTIP } from "@/lib/keyboard-shortcut-display";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS,
  OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS,
} from "@/lib/design-tokens";
import { isUiAuthorityThemeEvalEnabledEnv } from "@/lib/ui-authority-theme";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { PRODUCT_LINE_WORDMARK_ARIA_LABEL } from "@/lib/product-line/product-line-copy";
import { cn } from "@/lib/utils";

type OperatorShellTopBarProps = {
  readonly onOpenHelpSearch: () => void;
};

/**
 * Operator shell header: brand rail (sidebar width), content-aligned search, session controls.
 * Help stays freestanding; AI budget pill appears only when utilization is warn/critical.
 * Eval-only theme toggle uses the overflow menu when enabled.
 */
export function OperatorShellTopBar(props: OperatorShellTopBarProps): React.JSX.Element {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const { productLine } = useProductLine();
  const wordmarkAriaLabel = PRODUCT_LINE_WORDMARK_ARIA_LABEL[productLine];
  const showEngineerOperatorChrome = isOperatorExperienceFullShellEnv();
  const presenterQuiet = useReviewPresenterChromeActive();
  const showLlmBudgetPill =
    showEngineerOperatorChrome &&
    !presenterQuiet &&
    callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const showAuthorityThemeToggle = isUiAuthorityThemeEvalEnabledEnv();
  const showMoreMenu = showAuthorityThemeToggle;

  useSearchShortcut();

  return (
    <header
      data-testid="app-shell-topbar"
      className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
    >
      {/*
        Avoid overflow-x-hidden here: it forces overflow-y:auto on the short header.
        Single-row nowrap + min-w-0 keeps the sticky chrome budget thin.
      */}
      <div className="flex min-w-0 w-full flex-nowrap">
        <div
          className={cn(
            OPERATOR_SHELL_MAX_WIDTH_CLASS,
            "flex min-w-0 flex-1 flex-nowrap",
          )}
        >
          <div
            data-testid="app-shell-topbar-primary"
            className={cn(
              "flex min-w-0 shrink-0 items-center gap-3 px-4 py-2 lg:px-3",
              OPERATOR_SHELL_SIDEBAR_WIDTH_LG_CLASS,
            )}
          >
            <MobileNavDrawerDeferred />
            <h1 className="m-0">
              <TenantMastheadWordmark href="/" aria-label={wordmarkAriaLabel} variant="operator" />
            </h1>
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-1 flex-nowrap items-center gap-x-4 py-2.5",
              OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm lg:max-w-md xl:max-w-xl">
              <div className="min-w-0 flex-1">
                <GlobalSearchBarDeferred />
              </div>
            </div>
          </div>
        </div>

        <div
          data-testid="app-shell-topbar-session"
          className="ml-auto flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-3 py-2.5 pr-4 lg:pr-6"
        >
            <div
              data-testid="app-shell-topbar-context"
              className="flex min-w-0 flex-nowrap items-center gap-2"
            >
              <ScopeSwitcherDeferred density="compact" />
              <OperatorShellDemoWorkspaceTag />
            </div>
            <AuthPanel />
            <div className="flex shrink-0 items-center gap-2.5 border-l border-neutral-200 pl-3 dark:border-neutral-700">
              <GuidedModeTopBarChip />
              <SimulatorModeTopBarChip />
              <ShellInFlightOperationsAffordanceDeferred />
              <ToolbarHelpTooltip
                aria-label={OPERATOR_HELP_ARIA_LABEL}
                content={OPERATOR_HELP_TOOLTIP}
                aria-keyshortcuts={OPERATOR_HELP_ARIA_KEYSHORTCUTS}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("inline-flex items-center gap-1.5 px-2.5", OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS)}
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
                  <span className="hidden sm:inline">Help &amp; Support</span>
                </Button>
              </ToolbarHelpTooltip>
              {showLlmBudgetPill ? <LlmBudgetStatusPillDeferred /> : null}
              {showMoreMenu ? (
                <OperatorShellTopBarMoreMenuDeferred>
                  <div className="flex flex-col gap-2" data-testid="app-shell-topbar-more-tools">
                    <AuthorityThemeToggle />
                  </div>
                </OperatorShellTopBarMoreMenuDeferred>
              ) : null}
              <AccountSettingsMenuDeferred />
            </div>
        </div>
      </div>
    </header>
  );
}
