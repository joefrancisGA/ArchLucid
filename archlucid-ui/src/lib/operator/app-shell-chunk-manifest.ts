import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — app shell deferred chunk catalog (wave 1). */
export const APP_SHELL_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "app-shell-workspace-footer",
    label: "Loading workspace footer",
    variant: "compact",
    modulePath: "@/components/shell/AppShellWorkspaceFooter",
    exportName: "AppShellWorkspaceFooter",
  },
  {
    id: "app-shell-idle-overlays",
    label: "Loading idle overlays",
    variant: "compact",
    modulePath: "@/components/shell/AppShellIdleOverlays",
    exportName: "AppShellIdleOverlays",
  },
  {
    id: "app-shell-dev-testing-shortcuts",
    label: "Loading dev testing shortcuts",
    variant: "compact",
    modulePath: "@/components/dev-testing/DevTestingShellShortcuts",
    exportName: "DevTestingShellShortcuts",
  },
  {
    id: "app-shell-telemetry-bundle",
    label: "Loading telemetry bundle",
    variant: "compact",
    modulePath: "@/components/shell/AppShellTelemetryBundle",
    exportName: "AppShellTelemetryBundle",
  },
  {
    id: "app-shell-session-idle-timeout",
    label: "Loading session idle guard",
    variant: "compact",
    modulePath: "@/components/SessionIdleTimeoutGuard",
    exportName: "SessionIdleTimeoutGuard",
  },
  {
    id: "app-shell-auth-panel",
    label: "Loading auth panel",
    variant: "compact",
    modulePath: "@/components/AuthPanel",
    exportName: "AuthPanel",
  },
  {
    id: "app-shell-sync-active-run",
    label: "Loading active run sync",
    variant: "compact",
    modulePath: "@/components/SyncActiveRunFromPathname",
    exportName: "SyncActiveRunFromPathname",
  },
  {
    id: "app-shell-main-content-gate",
    label: "Loading main content gate",
    variant: "compact",
    modulePath: "@/components/shell/AppShellMainContentGate",
    exportName: "AppShellMainContentGate",
  },
  {
    id: "app-shell-access-redirects-host",
    label: "Loading access redirects",
    variant: "compact",
    modulePath: "@/components/shell/OperatorShellAccessRedirectsHost",
    exportName: "OperatorShellAccessRedirectsHost",
  },
  {
    id: "app-shell-toaster",
    label: "Loading toaster",
    variant: "compact",
    modulePath: "@/components/AppToaster",
    exportName: "AppToaster",
  },
  {
    id: "app-shell-route-announcer",
    label: "Loading route announcer",
    variant: "compact",
    modulePath: "@/components/RouteAnnouncer",
    exportName: "RouteAnnouncer",
  },
] as const;
