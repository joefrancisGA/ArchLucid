import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const shellDir = dirname(fileURLToPath(import.meta.url));

const topBarSource = readFileSync(join(shellDir, "OperatorShellTopBar.tsx"), "utf8");
const deferredSource = readFileSync(join(shellDir, "operator-shell-top-bar-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

const bannedStaticImports = [
  '@/components/GlobalSearchBar"',
  '@/components/MobileNavDrawer"',
  '@/components/ScopeSwitcher"',
  '@/components/shell/ShellInFlightOperationsAffordance"',
  '@/components/shell/AccountSettingsMenu"',
  '@/components/shell/OperatorShellTopBarMoreMenu"',
  '@/components/llm/LlmBudgetStatusPill"',
] as const;

describe("operator shell top bar deferred imports (TB-2118)", () => {
  it("keeps heavy top-bar modules off the sync import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(topBarSource).not.toContain(bannedImport);
    }

    expect(topBarSource).toContain("operator-shell-top-bar-deferred-chunks");
    expect(topBarSource).toContain("GlobalSearchBarDeferred");
    expect(topBarSource).toContain("LlmBudgetStatusPillDeferred");
  });

  it("dynamic-imports every top-bar module via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/llm/LlmBudgetStatusPill")');
    expect(deferredSource).toContain("operator-shell-top-bar-llm-budget-pill");
  });
});
