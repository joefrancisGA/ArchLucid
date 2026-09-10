import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  parseDriftTableSortKey,
  sortDriftChanges,
  toggleDriftTableSort,
} from "@/lib/infra-evidence/infra-evidence-drift-table-filter";

function buildChange(
  changeId: string,
  azureResourceId: string,
  overrides: Partial<InfraEvidenceDiffChange> = {},
): InfraEvidenceDiffChange {
  return {
    changeId,
    diffId: "diff-1",
    cloudResourceId: null,
    azureResourceId,
    changeType: 1,
    property: "sku",
    oldValue: null,
    newValue: null,
    riskClassification: null,
    evidenceReference: null,
    ...overrides,
  };
}

describe("infra-evidence-drift-table-filter", () => {
  it("parses resource group and resource type sort keys", () => {
    expect(parseDriftTableSortKey("resourceGroup")).toBe("resourceGroup");
    expect(parseDriftTableSortKey("resourceType")).toBe("resourceType");
    expect(parseDriftTableSortKey("unknown")).toBe("resource");
  });

  it("sorts by resource name", () => {
    const rows = [
      buildChange("b", "/subscriptions/sub/resourceGroups/rg-b/providers/Microsoft.Compute/virtualMachines/vm-zeta"),
      buildChange("a", "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.Compute/virtualMachines/vm-alpha"),
    ];

    const sorted = sortDriftChanges(rows, "resource", "asc");

    expect(sorted.map((row) => row.changeId)).toEqual(["a", "b"]);
  });

  it("sorts by resource group", () => {
    const rows = [
      buildChange("b", "/subscriptions/sub/resourceGroups/rg-zeta/providers/Microsoft.Compute/virtualMachines/vm-1"),
      buildChange("a", "/subscriptions/sub/resourceGroups/rg-alpha/providers/Microsoft.Compute/virtualMachines/vm-2"),
    ];

    const sorted = sortDriftChanges(rows, "resourceGroup", "asc");

    expect(sorted.map((row) => row.changeId)).toEqual(["a", "b"]);
  });

  it("sorts by resource type", () => {
    const rows = [
      buildChange("b", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-1"),
      buildChange("a", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1"),
    ];

    const sorted = sortDriftChanges(rows, "resourceType", "asc");

    expect(sorted.map((row) => row.changeId)).toEqual(["a", "b"]);
  });

  it("toggles sort direction when the same column is selected again", () => {
    const next = toggleDriftTableSort(
      {
        riskFilter: "",
        changeTypeFilter: "",
        resourceFilter: "",
        sortBy: "resourceGroup",
        sortDir: "asc",
        changesPage: 2,
        snapshotsPage: 1,
      },
      "resourceGroup",
    );

    expect(next.sortBy).toBe("resourceGroup");
    expect(next.sortDir).toBe("desc");
    expect(next.changesPage).toBe(1);
  });
});
