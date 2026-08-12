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
  '@/components/SponsorExecutiveShellRedirect"',
  '@/components/operator/OperatorRoleGate"',
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
    expect(appShellSource).toContain("AppShellKeyboardShortcutBoundary");
  });

  it("dynamic-imports deferred shell modules", () => {
    expect(deferredSource).toContain('import("./OperatorShellTopBar")');
    expect(deferredSource).toContain('import("./AppShellWorkspaceFooter")');
    expect(deferredSource).toContain('import("./AppShellIdleOverlays")');
    expect(deferredSource).toContain('import("@/components/dev-testing/DevTestingShellShortcuts")');
    expect(deferredSource).toContain('import("./AppShellTelemetryBundle")');
    expect(deferredSource).toContain('import("@/components/SessionIdleTimeoutGuard")');
    expect(deferredSource).toContain('import("@/components/AuthPanel")');
    expect(deferredSource).toContain('import("@/components/SyncActiveRunFromPathname")');
    expect(deferredSource).toContain('import("./AppShellMainContentGate")');
    expect(deferredSource).toContain("next/dynamic");
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
