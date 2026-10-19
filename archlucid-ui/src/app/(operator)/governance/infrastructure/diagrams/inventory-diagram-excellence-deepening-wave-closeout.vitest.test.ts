import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const deepeningWaveCompleteHeading = "### Deepening excellence wave (IDX-05b–12b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "inventory-diagram-excellence-subnet-wave-closeout",
  "inventory-diagram-excellence-singleton-tail-wave-closeout",
  "inventory-diagram-excellence-duplicate-connection-wave-closeout",
  "inventory-diagram-excellence-private-endpoint-wave-closeout",
  "inventory-diagram-excellence-completeness-wave-closeout",
  "inventory-diagram-excellence-hop-focus-wave-closeout",
  "inventory-diagram-excellence-deepening-wave-closeout",
];

describe("InventoryDiagramExcellence deepening wave closeout", () => {
  it("InventoryDiagramExcellence_deepening_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(deepeningWaveCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
