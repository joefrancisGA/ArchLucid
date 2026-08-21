import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const shellDir = dirname(fileURLToPath(import.meta.url));

const topBarSource = readFileSync(join(shellDir, "OperatorShellTopBar.tsx"), "utf8");
const deferredSource = readFileSync(join(shellDir, "operator-shell-top-bar-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(shellDir, "../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/GlobalSearchBar"',
  '@/components/MobileNavDrawer"',
  '@/components/ScopeSwitcher"',
  '@/components/shell/ShellInFlightOperationsAffordance"',
  '@/components/shell/AccountSettingsMenu"',
  '@/components/shell/OperatorShellTopBarMoreMenu"',
] as const;

describe("operator shell top bar deferred imports (TB-2118)", () => {
  it("keeps heavy top-bar modules off the sync import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(topBarSource).not.toContain(bannedImport);
    }

    expect(topBarSource).toContain("operator-shell-top-bar-deferred-chunks");
    expect(topBarSource).toContain("GlobalSearchBarDeferred");
    expect(topBarSource).toContain("MobileNavDrawerDeferred");
    expect(topBarSource).toContain("ScopeSwitcherDeferred");
    expect(topBarSource).toContain("ShellInFlightOperationsAffordanceDeferred");
    expect(topBarSource).toContain("OperatorShellTopBarMoreMenuDeferred");
    expect(topBarSource).toContain("AccountSettingsMenuDeferred");
    expect(topBarSource).toContain("LlmBudgetStatusPillDeferred");
  });

  it("dynamic-imports manifest-backed top-bar modules via loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(manifestLoaderSource).toContain('import("@/components/GlobalSearchBar")');
    expect(manifestLoaderSource).toContain('import("@/components/MobileNavDrawer")');
    expect(manifestLoaderSource).toContain('import("@/components/ScopeSwitcher")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/ShellInFlightOperationsAffordance")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/OperatorShellTopBarMoreMenu")');
    expect(manifestLoaderSource).toContain('import("@/components/shell/AccountSettingsMenu")');
    expect(deferredSource).toContain("operator-shell-top-bar-global-search");
    expect(deferredSource).toContain("operator-shell-top-bar-mobile-nav-drawer");
    expect(deferredSource).toContain("operator-shell-top-bar-scope-switcher");
    expect(deferredSource).toContain("operator-shell-top-bar-in-flight-operations");
    expect(deferredSource).toContain("operator-shell-top-bar-more-menu");
    expect(deferredSource).toContain("operator-shell-top-bar-account-settings");
  });

  it("keeps remaining top-bar modules on inline dynamic imports", () => {
    expect(deferredSource).toContain("next/dynamic");
    expect(deferredSource).toContain('import("@/components/llm/LlmBudgetStatusPill")');
    expect(deferredSource).toContain("deferredChunkLoader");
  });
});
