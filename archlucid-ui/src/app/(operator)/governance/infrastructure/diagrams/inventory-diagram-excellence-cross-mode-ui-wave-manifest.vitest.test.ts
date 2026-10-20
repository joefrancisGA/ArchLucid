import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const workbenchRatchetFileName = "inventory-diagram-excellence-workbench.ratchet.test.tsx";

const requiredWorkbenchRatchetTestNames: readonly string[] = [
  "InventoryDiagramExcellence_private_endpoint_toggle_defaults_off_without_url_flag",
  "InventoryDiagramExcellence_completeness_banner_renders_missing_classes_from_render_summary",
];

describe("InventoryDiagramExcellence cross-mode UI wave manifest", () => {
  it("InventoryDiagramExcellence_cross_mode_ui_wave_manifest_lists_workbench_ratchet_tests", () => {
    const directory = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(directory, workbenchRatchetFileName), "utf8");

    for (const testName of requiredWorkbenchRatchetTestNames) {
      expect(source).toContain(testName);
    }
  });
});
