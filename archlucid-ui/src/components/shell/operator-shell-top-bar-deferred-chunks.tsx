"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { AccountSettingsMenu } from "@/components/shell/AccountSettingsMenu";
import type { GlobalSearchBar } from "@/components/GlobalSearchBar";
import type { MobileNavDrawer } from "@/components/MobileNavDrawer";
import type { OperatorShellTopBarMoreMenu } from "@/components/shell/OperatorShellTopBarMoreMenu";
import type { ScopeSwitcher } from "@/components/ScopeSwitcher";
import type { ShellInFlightOperationsAffordance } from "@/components/shell/ShellInFlightOperationsAffordance";

export const GlobalSearchBarDeferred: ComponentType<React.ComponentProps<typeof GlobalSearchBar>> =
  createDeferredComponentFromManifest("operator-shell-top-bar-global-search", {
    loadingTestId: "global-search-bar-deferred-loading",
    loadingClassName: "h-9 w-full dark:bg-neutral-800/80",
  });

export const MobileNavDrawerDeferred: ComponentType = createDeferredComponentFromManifest(
  "operator-shell-top-bar-mobile-nav-drawer",
  { suppressLoading: true },
);

export const ScopeSwitcherDeferred: ComponentType<React.ComponentProps<typeof ScopeSwitcher>> =
  createDeferredComponentFromManifest("operator-shell-top-bar-scope-switcher", { suppressLoading: true });

export const ShellInFlightOperationsAffordanceDeferred: ComponentType =
  createDeferredComponentFromManifest("operator-shell-top-bar-in-flight-operations", {
    suppressLoading: true,
  });

export const OperatorShellTopBarMoreMenuDeferred: ComponentType<
  React.ComponentProps<typeof OperatorShellTopBarMoreMenu>
> = createDeferredComponentFromManifest("operator-shell-top-bar-more-menu", { suppressLoading: true });

export const AccountSettingsMenuDeferred: ComponentType = createDeferredComponentFromManifest(
  "operator-shell-top-bar-account-settings",
  { suppressLoading: true },
);

export const LlmBudgetStatusPillDeferred: ComponentType = createDeferredComponentFromManifest(
  "operator-shell-top-bar-llm-budget-pill",
  { suppressLoading: true },
);
