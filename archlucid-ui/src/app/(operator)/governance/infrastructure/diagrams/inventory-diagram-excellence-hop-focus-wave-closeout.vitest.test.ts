import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const hopFocusCompleteHeading = "### Hop-focus deepening (IDX-12b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~InventoryDiagramExcellenceHopFocus",
  "inventory-diagram-excellence-hop-focus-wave-closeout",
];

describe("InventoryDiagramExcellence hop-focus wave closeout", () => {
  it("InventoryDiagramExcellence_hop_focus_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(hopFocusCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
