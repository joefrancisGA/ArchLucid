"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { AccountSettingsMenu } from "@/components/shell/AccountSettingsMenu";
import type { GlobalSearchBar } from "@/components/GlobalSearchBar";
import type { LlmBudgetStatusPill } from "@/components/LlmBudgetStatusPill";
import type { MobileNavDrawer } from "@/components/MobileNavDrawer";
import type { OperatorShellTopBarMoreMenu } from "@/components/shell/OperatorShellTopBarMoreMenu";
import type { ScopeSwitcher } from "@/components/ScopeSwitcher";
import type { ShellInFlightOperationsAffordance } from "@/components/shell/ShellInFlightOperationsAffordance";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";

function GlobalSearchBarDeferredLoading(): React.JSX.Element {
  return (
    <div
      className="h-9 w-full animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/80"
      data-testid="global-search-bar-deferred-loading"
      aria-hidden
    />
  );
}

export const GlobalSearchBarDeferred: ComponentType<React.ComponentProps<typeof GlobalSearchBar>> = dynamic(
  deferredChunkLoader(() => import("@/components/GlobalSearchBar").then((module) => module.GlobalSearchBar)),
  {
    ssr: false,
    loading: () => <GlobalSearchBarDeferredLoading />,
  },
);

export const MobileNavDrawerDeferred: ComponentType = dynamic(
  deferredChunkLoader(() => import("@/components/MobileNavDrawer").then((module) => module.MobileNavDrawer)),
  { ssr: false },
);

export const ScopeSwitcherDeferred: ComponentType<React.ComponentProps<typeof ScopeSwitcher>> = dynamic(
  deferredChunkLoader(() => import("@/components/ScopeSwitcher").then((module) => module.ScopeSwitcher)),
  { ssr: false },
);

export const ShellInFlightOperationsAffordanceDeferred: ComponentType = dynamic(
  deferredChunkLoader(() =>
    import("@/components/shell/ShellInFlightOperationsAffordance").then(
      (module) => module.ShellInFlightOperationsAffordance,
    ),
  ),
  { ssr: false },
);

export const OperatorShellTopBarMoreMenuDeferred: ComponentType<
  React.ComponentProps<typeof OperatorShellTopBarMoreMenu>
> = dynamic(
  deferredChunkLoader(() =>
    import("@/components/shell/OperatorShellTopBarMoreMenu").then(
      (module) => module.OperatorShellTopBarMoreMenu,
    ),
  ),
  { ssr: false },
);

export const AccountSettingsMenuDeferred: ComponentType = dynamic(
  deferredChunkLoader(() =>
    import("@/components/shell/AccountSettingsMenu").then((module) => module.AccountSettingsMenu),
  ),
  { ssr: false },
);

export const LlmBudgetStatusPillDeferred: ComponentType = dynamic(
  deferredChunkLoader(() => import("@/components/LlmBudgetStatusPill").then((module) => module.LlmBudgetStatusPill)),
  { ssr: false },
);
