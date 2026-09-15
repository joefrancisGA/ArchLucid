import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  isNestedResourceRemovedChange,
  suppressNestedResourceRemovedChanges,
} from "@/lib/infra-evidence/suppress-nested-resource-removed-changes";

function buildRemovedChange(changeId: string, azureResourceId: string): InfraEvidenceDiffChange {
  return {
    changeId,
    diffId: "diff-1",
    cloudResourceId: null,
    azureResourceId,
    changeType: "ResourceRemoved",
    property: null,
    oldValue: "Microsoft.Compute/virtualMachines",
    newValue: null,
    riskClassification: null,
    securitySignificance: null,
    architectureSignificance: null,
    evidenceReference: null,
  };
}

describe("suppress-nested-resource-removed-changes", () => {
  it("suppresses child resource removals when a removed parent exists", () => {
    const parentArmId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
    const childArmId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/ext";
    const rows = [
      buildRemovedChange("parent", parentArmId),
      buildRemovedChange("child", childArmId),
      buildRemovedChange("sibling", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm2"),
    ];

    expect(suppressNestedResourceRemovedChanges(rows).map((row) => row.changeId)).toEqual([
      "parent",
      "sibling",
    ]);
  });

  it("does not treat similar sibling resource names as nested removals", () => {
    const siblingA =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    const siblingB =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa10";

    expect(isNestedResourceRemovedChange(buildRemovedChange("b", siblingB), [siblingA])).toBe(false);
  });
});
