import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const closeoutWaveCompleteHeading = "### Excellence index closeout wave (IDX-14a–14k) — complete";

const crossModeCompleteHeading = "### Cross-mode excellence wave (IDX-08b–13z) — complete";

const deepeningCompleteHeading = "### Deepening excellence wave (IDX-05b–12b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "inventory-diagram-excellence-cross-mode-wave-closeout",
  "inventory-diagram-excellence-deepening-wave-closeout",
  "inventory-diagram-excellence-closeout-wave-closeout",
  "inventory-diagram-excellence-closeout-wave-ui-manifest",
  "inventory-diagram-excellence-14k-closeout-capstone-index-sync",
];

describe("InventoryDiagramExcellence closeout wave closeout", () => {
  it("InventoryDiagramExcellence_closeout_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(closeoutWaveCompleteHeading);
    expect(source).toContain(crossModeCompleteHeading);
    expect(source).toContain(deepeningCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
