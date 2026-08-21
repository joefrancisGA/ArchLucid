"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { AppShellKeyboardShortcutBoundary } from "@/components/shell/AppShellKeyboardShortcutBoundary";
import type { AuthorityThemeToggle } from "@/components/AuthorityThemeToggle";
import type { ColorModeToggle } from "@/components/ColorModeToggle";
import type { ShellThemePreferencesAppearanceVocabularyRail } from "@/components/ShellThemePreferencesAppearanceVocabularyRail";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
} from "@/lib/design-tokens";
import { deferredChunkLoader } from "@/lib/import-deferred-chunk-with-retry";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

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
export const OperatorShellTopBarDeferred = dynamic(
  () => import("./OperatorShellTopBar").then((module) => module.OperatorShellTopBar),
  { ssr: false, loading: () => operatorTopBarLoading },
);

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
> = dynamic(
  deferredChunkLoader(() =>
    import("./AppShellKeyboardShortcutBoundary").then((module) => module.AppShellKeyboardShortcutBoundary),
  ),
  { ssr: false },
);

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

export const ColorModeToggleDeferred: ComponentType<React.ComponentProps<typeof ColorModeToggle>> = dynamic(
  deferredChunkLoader(() => import("@/components/ColorModeToggle").then((module) => module.ColorModeToggle)),
  { ssr: false, loading: () => null },
);

export const AuthorityThemeToggleDeferred: ComponentType<React.ComponentProps<typeof AuthorityThemeToggle>> =
  dynamic(
    deferredChunkLoader(() =>
      import("@/components/AuthorityThemeToggle").then((module) => module.AuthorityThemeToggle),
    ),
    { ssr: false, loading: () => null },
  );

export const ShellThemePreferencesAppearanceVocabularyRailDeferred: ComponentType<
  React.ComponentProps<typeof ShellThemePreferencesAppearanceVocabularyRail>
> = dynamic(
  deferredChunkLoader(() =>
    import("@/components/ShellThemePreferencesAppearanceVocabularyRail").then(
      (module) => module.ShellThemePreferencesAppearanceVocabularyRail,
    ),
  ),
  { ssr: false, loading: () => null },
);
