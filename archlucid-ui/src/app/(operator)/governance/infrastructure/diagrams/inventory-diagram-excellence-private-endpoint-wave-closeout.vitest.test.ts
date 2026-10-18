import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..");
const indexRelativePath = ".cursor/prompts/inventory-diagram-excellence-00-index.md";

const privateEndpointCompleteHeading = "### Private endpoint opt-in deepening (IDX-10b) — complete";

const requiredIndexFilterTokens: readonly string[] = [
  "FullyQualifiedName~InventoryDiagramExcellencePrivateEndpoint",
  "inventory-diagram-excellence-private-endpoint-wave-closeout",
];

describe("InventoryDiagramExcellence private endpoint wave closeout", () => {
  it("InventoryDiagramExcellence_private_endpoint_wave_closeout_index_documents_complete_slice", () => {
    const source = readFileSync(join(repoRoot, indexRelativePath), "utf8");

    expect(source).toContain(privateEndpointCompleteHeading);

    for (const token of requiredIndexFilterTokens) {
      expect(source).toContain(token);
    }
  });
});
