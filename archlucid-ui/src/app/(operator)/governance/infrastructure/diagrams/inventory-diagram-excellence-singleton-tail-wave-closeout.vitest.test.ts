import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const singletonTailCompleteHeading = "### Singleton-RG tail deepening (IDX-08b–08c) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~InventoryDiagramExcellenceSingletonTail",
  "FullyQualifiedName~InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchet",
  "inventory-diagram-excellence-singleton-tail-wave-closeout",
];

describe("InventoryDiagramExcellence singleton tail wave closeout", () => {
  it("InventoryDiagramExcellence_singleton_tail_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(singletonTailCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
