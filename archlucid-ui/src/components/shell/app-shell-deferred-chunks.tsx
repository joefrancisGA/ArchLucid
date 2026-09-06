"use client";

import type { ComponentType, JSX } from "react";

import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

import type { AppShellKeyboardShortcutBoundary } from "@/components/shell/AppShellKeyboardShortcutBoundary";
import type { HelpPanel } from "@/components/HelpPanel";
import type { HelpSearchPanel } from "@/components/HelpSearchPanel";
import type { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";

const operatorTopBarLoading = (
  <header
    className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
    aria-hidden
  >
    <div
      className={cn(
        OPERATOR_SHELL_MAX_WIDTH_CLASS,
        OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
        "flex h-14 animate-pulse items-center justify-between gap-3",
      )}
    >
      <div className="h-8 w-40 rounded-md bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-8 w-56 rounded-md bg-neutral-200 dark:bg-neutral-800" />
    </div>
  </header>
);

/** TB-2118 — command palette / global search / mobile drawer off hub First Load JS. */
export const OperatorShellTopBarDeferred = createDeferredComponentFromManifest("operator-shell-top-bar", {
  loadingWrapper: () => operatorTopBarLoading,
});

export const AppShellWorkspaceFooterDeferred = createDeferredComponentFromManifest(
  "app-shell-workspace-footer",
  { suppressLoading: true },
);

export const AppShellIdleOverlaysDeferred = createDeferredComponentFromManifest("app-shell-idle-overlays", {
  suppressLoading: true,
});

export const DevTestingShellShortcutsDeferred = createDeferredComponentFromManifest(
  "app-shell-dev-testing-shortcuts",
  { suppressLoading: true },
);

export const DevTestingQuickSwitchPanelDeferred = createDeferredComponentFromManifest(
  "operator-home-dev-testing-quick-switch",
  { suppressLoading: true },
);

export const AppShellTelemetryBundleDeferred = createDeferredComponentFromManifest(
  "app-shell-telemetry-bundle",
  { suppressLoading: true },
);

export const SessionIdleTimeoutGuardDeferred = createDeferredComponentFromManifest(
  "app-shell-session-idle-timeout",
  { suppressLoading: true },
);

export const AuthPanelDeferred = createDeferredComponentFromManifest("app-shell-auth-panel", {
  suppressLoading: true,
});

export const SyncActiveRunFromPathnameDeferred = createDeferredComponentFromManifest(
  "app-shell-sync-active-run",
  { suppressLoading: true },
);

export const AppShellMainContentGateDeferred = createDeferredComponentFromManifest(
  "app-shell-main-content-gate",
  { suppressLoading: true },
);

export const AppShellKeyboardShortcutBoundaryDeferred: ComponentType<
  React.ComponentProps<typeof AppShellKeyboardShortcutBoundary>
> = createDeferredComponentFromManifest("app-shell-keyboard-shortcut-boundary", { suppressLoading: true });

export const OperatorShellAccessRedirectsHostDeferred = createDeferredComponentFromManifest(
  "app-shell-access-redirects-host",
  { suppressLoading: true },
);

export const AppToasterDeferred = createDeferredComponentFromManifest("app-shell-toaster", {
  suppressLoading: true,
});

export const RouteAnnouncerDeferred = createDeferredComponentFromManifest("app-shell-route-announcer", {
  suppressLoading: true,
});

export const ColorModeToggleDeferred = createDeferredComponentFromManifest("app-shell-color-mode-toggle", {
  suppressLoading: true,
});

export const AuthorityThemeToggleDeferred = createDeferredComponentFromManifest(
  "app-shell-authority-theme-toggle",
  { suppressLoading: true },
);

export const ShellThemePreferencesAppearanceVocabularyRailDeferred: ComponentType<
  React.ComponentProps<typeof ShellThemePreferencesAppearanceVocabularyRail>
> = createDeferredComponentFromManifest("app-shell-theme-preferences-vocabulary-rail", {
  suppressLoading: true,
});

const appShellSidebarNavLoadingWrapper = (): JSX.Element => (
  <div className="min-h-[12rem] animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800" aria-hidden />
);

export const FrictionlessTrialBannerDeferred = createDeferredComponentFromManifest(
  "app-shell-frictionless-trial-banner",
  { suppressLoading: true },
);

export const AppShellMainAffordancesDeferred = createDeferredComponentFromManifest(
  "app-shell-main-affordances",
  { suppressLoading: true },
);

export const OnboardingTourDeferred = createDeferredComponentFromManifest("app-shell-onboarding-tour", {
  suppressLoading: true,
});

export const RegistrationOnboardingTourAutoStartDeferred = createDeferredComponentFromManifest(
  "app-shell-registration-onboarding-tour-auto-start",
  { suppressLoading: true },
);

export const HelpSearchPanelDeferred: ComponentType<React.ComponentProps<typeof HelpSearchPanel>> =
  createDeferredComponentFromManifest("app-shell-help-search-panel", { suppressLoading: true });

export const HelpPanelDeferred: ComponentType<React.ComponentProps<typeof HelpPanel>> =
  createDeferredComponentFromManifest("app-shell-help-panel", { suppressLoading: true });

export const SidebarNavDeferred = createDeferredComponentFromManifest("app-shell-sidebar-nav", {
  loadingWrapper: appShellSidebarNavLoadingWrapper,
});

export const AppShellStatusBannersDeferred = createDeferredComponentFromManifest(
  "app-shell-status-banners",
  { suppressLoading: true },
);

export const TrialLimitModalHostDeferred = createDeferredComponentFromManifest(
  "app-shell-trial-limit-modal-host",
  { suppressLoading: true },
);

export const CtoDemoJourneyCaptionBarDeferred = createDeferredComponentFromManifest(
  "app-shell-cto-demo-journey-caption-bar",
  { suppressLoading: true },
);
