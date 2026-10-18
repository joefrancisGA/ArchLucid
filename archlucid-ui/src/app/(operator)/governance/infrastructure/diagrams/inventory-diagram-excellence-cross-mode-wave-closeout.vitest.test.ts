import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const crossModeCompleteHeading =
  "### Cross-mode excellence wave (IDX-08b–13z) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~CrossModeWaveManifest",
  "FullyQualifiedName~CrossModeTraitGuard",
  "FullyQualifiedName~FatGraphForestDotParityRatchet",
  "inventory-diagram-excellence-workbench.ratchet",
  "inventory-diagram-excellence-cross-mode-ui-wave-manifest",
  "inventory-diagram-excellence-cross-mode-wave-closeout",
];

describe("InventoryDiagramExcellence cross-mode wave closeout", () => {
  it("InventoryDiagramExcellence_cross_mode_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(crossModeCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
