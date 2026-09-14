import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange, InfraEvidenceDiffSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  filterDriftChanges,
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
    securitySignificance: null,
    architectureSignificance: null,
    evidenceReference: null,
    ...overrides,
  };
}

function buildDiff(
  snapshotAId: string,
  snapshotBId: string,
): InfraEvidenceDiffSummary {
  return {
    diffId: "diff-1",
    snapshotAId,
    snapshotBId,
    subscriptionId: "sub-1",
    totalChanges: 2,
    resourceAddedCount: 0,
    resourceRemovedCount: 1,
    resourceModifiedCount: 1,
    createdUtc: "2026-01-01T00:00:00Z",
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

  it("hides resource-removed rows unless two inventory snapshots are being compared", () => {
    const rows = [
      buildChange("removed", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-removed", {
        changeType: "ResourceRemoved",
      }),
      buildChange("modified", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-modified", {
        changeType: "ResourceModified",
      }),
    ];

    const sameSnapshotDiff = buildDiff(
      "11111111-1111-1111-1111-111111111111",
      "11111111-1111-1111-1111-111111111111",
    );
    const twoSnapshotDiff = buildDiff(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    );

    expect(filterDriftChanges(rows, { riskFilter: "", changeTypeFilter: "", resourceFilter: "" }, sameSnapshotDiff)).toEqual([
      rows[1],
    ]);
    expect(filterDriftChanges(rows, { riskFilter: "", changeTypeFilter: "", resourceFilter: "" }, twoSnapshotDiff)).toEqual(rows);
  });

  it("filters drift rows by none and unknown risk keys", () => {
    const rows = [
      buildChange("none", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-none", {
        changeType: "ResourceModified",
        riskClassification: null,
      }),
      buildChange("unknown", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-unknown", {
        changeType: "ResourceModified",
        riskClassification: "unknown",
      }),
      buildChange("elevated", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-elevated", {
        changeType: "ResourceModified",
        riskClassification: "elevated",
      }),
    ];
    const twoSnapshotDiff = buildDiff(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    );

    expect(filterDriftChanges(rows, { riskFilter: "none", changeTypeFilter: "", resourceFilter: "" }, twoSnapshotDiff)).toEqual([rows[0]]);
    expect(filterDriftChanges(rows, { riskFilter: "unknown", changeTypeFilter: "", resourceFilter: "" }, twoSnapshotDiff)).toEqual([rows[1]]);
    expect(filterDriftChanges(rows, { riskFilter: "elevated", changeTypeFilter: "", resourceFilter: "" }, twoSnapshotDiff)).toEqual([rows[2]]);
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
