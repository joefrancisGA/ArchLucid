import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — operator shell top bar deferred chunk catalog (wave 1). */
export const OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "operator-shell-top-bar-global-search",
    label: "Loading global search",
    variant: "context",
    modulePath: "@/components/GlobalSearchBar",
    exportName: "GlobalSearchBar",
  },
  {
    id: "operator-shell-top-bar-mobile-nav-drawer",
    label: "Loading mobile navigation",
    variant: "compact",
    modulePath: "@/components/MobileNavDrawer",
    exportName: "MobileNavDrawer",
  },
  {
    id: "operator-shell-top-bar-scope-switcher",
    label: "Loading scope switcher",
    variant: "compact",
    modulePath: "@/components/ScopeSwitcher",
    exportName: "ScopeSwitcher",
  },
  {
    id: "operator-shell-top-bar-in-flight-operations",
    label: "Loading in-flight operations",
    variant: "compact",
    modulePath: "@/components/shell/ShellInFlightOperationsAffordance",
    exportName: "ShellInFlightOperationsAffordance",
  },
  {
    id: "operator-shell-top-bar-more-menu",
    label: "Loading more menu",
    variant: "compact",
    modulePath: "@/components/shell/OperatorShellTopBarMoreMenu",
    exportName: "OperatorShellTopBarMoreMenu",
  },
  {
    id: "operator-shell-top-bar-account-settings",
    label: "Loading account settings",
    variant: "compact",
    modulePath: "@/components/shell/AccountSettingsMenu",
    exportName: "AccountSettingsMenu",
  },
  {
    id: "operator-shell-top-bar-llm-budget-pill",
    label: "Loading LLM budget status",
    variant: "compact",
    modulePath: "@/components/llm/LlmBudgetStatusPill",
    exportName: "LlmBudgetStatusPill",
  },
] as const;
