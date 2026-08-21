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
] as const;
