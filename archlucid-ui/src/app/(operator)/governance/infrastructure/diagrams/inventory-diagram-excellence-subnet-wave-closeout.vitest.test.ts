import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const subnetCompleteHeading = "### Subnet nested-frame deepening (IDX-05b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchet",
  "FullyQualifiedName~InventoryDiagramExcellencePeeledSubnetVnetFrameRatchet",
  "inventory-diagram-excellence-subnet-wave-closeout",
];

describe("InventoryDiagramExcellence subnet wave closeout", () => {
  it("InventoryDiagramExcellence_subnet_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(subnetCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
