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

  it("dynamic-imports every app shell module via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(deferredSource).not.toContain("deferredChunkLoader");
    expect(manifestLoaderSource).toContain('import("@/components/shell/OperatorShellTopBar")');
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
    expect(manifestLoaderSource).toContain('import("@/components/shell/AppShellKeyboardShortcutBoundary")');
    expect(manifestLoaderSource).toContain('import("@/components/ColorModeToggle")');
    expect(manifestLoaderSource).toContain('import("@/components/AuthorityThemeToggle")');
    expect(manifestLoaderSource).toContain('import("@/components/ShellThemePreferencesAppearanceVocabularyRail")');
    expect(deferredSource).toContain("operator-shell-top-bar");
    expect(deferredSource).toContain("app-shell-keyboard-shortcut-boundary");
    expect(deferredSource).toContain("app-shell-color-mode-toggle");
    expect(deferredSource).toContain("app-shell-authority-theme-toggle");
    expect(deferredSource).toContain("app-shell-theme-preferences-vocabulary-rail");
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
