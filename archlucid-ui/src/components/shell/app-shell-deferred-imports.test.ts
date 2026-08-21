import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const shellDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(shellDir, "..");

const appShellSource = readFileSync(join(componentsDir, "AppShellClient.tsx"), "utf8");
const deferredSource = readFileSync(join(shellDir, "app-shell-deferred-chunks.tsx"), "utf8");
const topBarSource = readFileSync(join(shellDir, "OperatorShellTopBar.tsx"), "utf8");
const topBarDeferredSource = readFileSync(join(shellDir, "operator-shell-top-bar-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(componentsDir, "../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/shell/OperatorShellTopBar"',
  '@/components/shell/AppShellWorkspaceFooter"',
  '@/components/shell/AppShellIdleOverlays"',
  '@/components/dev-testing/DevTestingShellShortcuts"',
  '@/components/KeyboardShortcutProvider"',
  '@/components/AppInsightsTelemetryInit"',
  '@/components/ClientRuntimeDiagnostics"',
  '@/components/operator/OperatorRouteEnteredTelemetry"',
  '@/components/SessionIdleTimeoutGuard"',
  '@/components/AuthPanel"',
  '@/components/SyncActiveRunFromPathname"',
  '@/components/DemoStrictNavigationGate"',
  '@/components/SponsorShellRedirect"',
  '@/components/operator/OperatorRoleGate"',
  '@/components/shell/AppShellKeyboardShortcutBoundary"',
  '@/components/shell/OperatorShellAccessRedirectsHost"',
  '@/components/AppToaster"',
  '@/components/RouteAnnouncer"',
  '@/components/ColorModeToggle"',
  '@/components/AuthorityThemeToggle"',
  '@/components/ShellThemePreferencesAppearanceVocabularyRail"',
] as const;

const bannedTopBarStaticImports = [
  '@/components/GlobalSearchBar"',
  '@/components/MobileNavDrawer"',
  '@/components/ScopeSwitcher"',
  '@/components/shell/ShellInFlightOperationsAffordance"',
  '@/components/shell/AccountSettingsMenu"',
  '@/components/shell/OperatorShellTopBarMoreMenu"',
  '@/components/llm/LlmBudgetStatusPill"',
] as const;

describe("operator shell deferred imports (TB-2118)", () => {
  it("keeps heavy shell chrome off AppShellClient static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(appShellSource).not.toContain(bannedImport);
    }

    expect(appShellSource).toContain("app-shell-deferred-chunks");
    expect(appShellSource).toContain("OperatorShellTopBarDeferred");
    expect(appShellSource).toContain("AppShellWorkspaceFooterDeferred");
    expect(appShellSource).toContain("AppShellIdleOverlaysDeferred");
    expect(appShellSource).toContain("DevTestingShellShortcutsDeferred");
    expect(appShellSource).toContain("AppShellTelemetryBundleDeferred");
    expect(appShellSource).toContain("SessionIdleTimeoutGuardDeferred");
    expect(appShellSource).toContain("AuthPanelDeferred");
    expect(appShellSource).toContain("SyncActiveRunFromPathnameDeferred");
    expect(appShellSource).toContain("AppShellMainContentGateDeferred");
    expect(appShellSource).toContain("AppShellKeyboardShortcutBoundaryDeferred");
    expect(appShellSource).toContain("OperatorShellAccessRedirectsHostDeferred");
    expect(appShellSource).toContain("AppToasterDeferred");
    expect(appShellSource).toContain("RouteAnnouncerDeferred");
    expect(appShellSource).toContain("ColorModeToggleDeferred");
    expect(appShellSource).toContain("AuthorityThemeToggleDeferred");
    expect(appShellSource).toContain("ShellThemePreferencesAppearanceVocabularyRailDeferred");
  });

  it("dynamic-imports manifest-backed app shell modules via loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(manifestLoaderSource).toContain('import("@/components/shell/AppShellWorkspaceFooter")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/AppShellIdleOverlays")');
    expect(manifestLoaderSource).toContain('import("@/components/dev-testing/DevTestingShellShortcuts")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/AppShellTelemetryBundle")');
    expect(manifestLoaderSource).toContain('import("@/components/SessionIdleTimeoutGuard")');
    expect(manifestLoaderSource).toContain('import("@/components/AuthPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/SyncActiveRunFromPathname")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/AppShellMainContentGate")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/OperatorShellAccessRedirectsHost")');
    expect(manifestLoaderSource).toContain('import("@/components/AppToaster")');
    expect(manifestLoaderSource).toContain('import("@/components/RouteAnnouncer")');
    expect(deferredSource).toContain("app-shell-workspace-footer");
    expect(deferredSource).toContain("app-shell-idle-overlays");
    expect(deferredSource).toContain("app-shell-dev-testing-shortcuts");
    expect(deferredSource).toContain("app-shell-telemetry-bundle");
    expect(deferredSource).toContain("app-shell-session-idle-timeout");
    expect(deferredSource).toContain("app-shell-auth-panel");
    expect(deferredSource).toContain("app-shell-sync-active-run");
    expect(deferredSource).toContain("app-shell-main-content-gate");
    expect(deferredSource).toContain("app-shell-access-redirects-host");
    expect(deferredSource).toContain("app-shell-toaster");
    expect(deferredSource).toContain("app-shell-route-announcer");
  });

  it("keeps remaining shell modules on inline dynamic imports", () => {
    expect(deferredSource).toContain("next/dynamic");
    expect(deferredSource).toContain('import("./OperatorShellTopBar")');
    expect(deferredSource).toContain('import("./AppShellKeyboardShortcutBoundary")');
    expect(deferredSource).toContain('import("@/components/ColorModeToggle")');
    expect(deferredSource).toContain('import("@/components/AuthorityThemeToggle")');
    expect(deferredSource).toContain('import("@/components/ShellThemePreferencesAppearanceVocabularyRail")');
    expect(deferredSource).toContain("deferredChunkLoader");
  });

  it("keeps heavy top-bar modules off the sync import graph", () => {
    for (const bannedImport of bannedTopBarStaticImports) {
      expect(topBarSource).not.toContain(bannedImport);
    }

    expect(topBarSource).toContain("operator-shell-top-bar-deferred-chunks");
    expect(topBarSource).toContain("GlobalSearchBarDeferred");
    expect(topBarSource).toContain("MobileNavDrawerDeferred");
  });

  it("dynamic-imports deferred top-bar modules", () => {
    expect(topBarDeferredSource).toContain('import("@/components/GlobalSearchBar")');
    expect(topBarDeferredSource).toContain('import("@/components/MobileNavDrawer")');
    expect(topBarDeferredSource).toContain("next/dynamic");
  });
});
