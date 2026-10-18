import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const duplicateConnectionCompleteHeading = "### Duplicate connection deepening (IDX-09b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~InventoryDiagramExcellenceDuplicateConnection",
  "inventory-diagram-excellence-duplicate-connection-wave-closeout",
];

describe("InventoryDiagramExcellence duplicate connection wave closeout", () => {
  it("InventoryDiagramExcellence_duplicate_connection_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(duplicateConnectionCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
