import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const requiredCloseoutVitestFileNames: readonly string[] = [
  "inventory-diagram-excellence-subnet-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-singleton-tail-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-duplicate-connection-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-private-endpoint-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-completeness-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-hop-focus-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-cross-mode-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-deepening-wave-closeout.vitest.test.ts",
  "inventory-diagram-excellence-closeout-wave-closeout.vitest.test.ts",
];

describe("InventoryDiagramExcellence closeout wave UI manifest", () => {
  it("InventoryDiagramExcellence_closeout_wave_ui_manifest_lists_closeout_vitest_files", () => {
    const directory = dirname(fileURLToPath(import.meta.url));

    for (const fileName of requiredCloseoutVitestFileNames) {
      const filePath = join(directory, fileName);

      expect(existsSync(filePath)).toBe(true);
    }
  });
});
