import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  buildDriftResourceChangeGroup,
  findDriftResourceChangeGroupByChangeId,
  groupDriftChangesByResource,
  pickRepresentativeDriftChange,
  resolveDriftResourceGroupKey,
  sortDriftResourceChangeGroups,
  summarizeDriftResourceGroupChangeTypes,
  summarizeDriftResourceGroupProperties,
} from "@/lib/infra-evidence/group-drift-changes-by-resource";

function buildChange(
  changeId: string,
  azureResourceId: string,
  overrides: Partial<InfraEvidenceDiffChange> = {},
): InfraEvidenceDiffChange {
  return {
    changeId,
    diffId: "diff-1",
    cloudResourceId: "22222222-2222-2222-2222-222222222222",
    azureResourceId,
    changeType: "ResourceModified",
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

describe("group-drift-changes-by-resource", () => {
  it("groups changes by cloud resource id", () => {
    const azureResourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw";
    const rows = [
      buildChange("change-1", azureResourceId, { property: "sku" }),
      buildChange("change-2", azureResourceId, { property: "tags", riskClassification: "High" }),
    ];

    const groups = groupDriftChangesByResource(rows);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.changes).toHaveLength(2);
    expect(resolveDriftResourceGroupKey(rows[0])).toBe("cloud:22222222-2222-2222-2222-222222222222");
  });

  it("picks the highest-risk change as the representative", () => {
    const rows = [
      buildChange("change-low", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm", {
        riskClassification: "low",
        property: "tags",
      }),
      buildChange("change-high", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm", {
        riskClassification: "High",
        property: "sku",
      }),
    ];

    const representative = pickRepresentativeDriftChange(rows);

    expect(representative.changeId).toBe("change-high");
  });

  it("summarizes multiple property changes for table cells", () => {
    const group = buildDriftResourceChangeGroup("cloud:resource", [
      buildChange("change-1", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm", {
        property: "sku",
      }),
      buildChange("change-2", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm", {
        property: "tags",
      }),
    ]);

    expect(summarizeDriftResourceGroupProperties(group)).toBe("2 properties");
    expect(summarizeDriftResourceGroupChangeTypes(group)).toBe("Resource modified");
  });

  it("finds a group by contained change id", () => {
    const groups = groupDriftChangesByResource([
      buildChange("change-1", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-a"),
      buildChange("change-2", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-b"),
    ]);

    expect(findDriftResourceChangeGroupByChangeId(groups, "change-2")?.groupKey).toContain("cloud:");
  });

  it("sorts grouped rows by representative resource name", () => {
    const groups = groupDriftChangesByResource([
      buildChange("change-b", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-zeta", {
        cloudResourceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
      buildChange("change-a", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-alpha", {
        cloudResourceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      }),
    ]);

    const sorted = sortDriftResourceChangeGroups(groups, "resource", "asc");

    expect(sorted.map((group) => group.representativeChange.changeId)).toEqual(["change-a", "change-b"]);
  });
});
