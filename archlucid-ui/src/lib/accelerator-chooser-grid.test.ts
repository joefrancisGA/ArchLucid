import { describe, expect, it } from "vitest";

import {
  ACCELERATOR_CHOOSER_ENTRIES,
  ACCELERATOR_COST_GOVERNANCE_PACK_IDS,
  isAcceleratorCostGovernancePackId,
} from "@/lib/accelerator-chooser";
import { buildAcceleratorChooserGridItems } from "@/lib/accelerator-chooser-grid";

describe("accelerator-chooser cost governance grouping", () => {
  it("marks all three cloud cost packs as cost-governance ids", () => {
    for (const packId of ACCELERATOR_COST_GOVERNANCE_PACK_IDS) {
      expect(isAcceleratorCostGovernancePackId(packId)).toBe(true);
      expect(ACCELERATOR_CHOOSER_ENTRIES.some((entry) => entry.id === packId)).toBe(true);
    }
  });

  it("builds a single grouped grid row for cost governance packs", () => {
    expect(buildAcceleratorChooserGridItems()).toHaveLength(5);
  });
});
