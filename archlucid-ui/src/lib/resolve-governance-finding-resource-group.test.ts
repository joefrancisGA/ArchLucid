import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

import { groupGovernanceFindingQueueRows } from "@/lib/group-governance-finding-queue-rows";
import {
  extractAzureResourceIdFromText,
  resolveGovernanceFindingResourceGroup,
  shortenResourceId,
} from "@/lib/resolve-governance-finding-resource-group";

function sampleRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Enterprise Customer Intake Modernization Review",
    manifestId: " — ",
    findingId: "finding-1",
    title: "Sample finding",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Review",
    recordKind: "finding",
    ...overrides,
  };
}

describe("resolveGovernanceFindingResourceGroup", () => {
  it("prefers explicit resourceId over systemName", () => {
    const group = resolveGovernanceFindingResourceGroup(
      sampleRow({
        resourceId:
          "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/claims-kv-1",
        systemName: "Claims Intake",
      }),
    );

    expect(group.label).toBe("Microsoft.KeyVault/vaults/claims-kv-1");
  });

  it("extracts Azure resource ids from finding titles", () => {
    const group = resolveGovernanceFindingResourceGroup(
      sampleRow({
        title: "Public endpoint on /subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st1",
      }),
    );

    expect(group.label).toBe("Microsoft.Storage/storageAccounts/st1");
  });

  it("falls back to systemName when no resource id is available", () => {
    const group = resolveGovernanceFindingResourceGroup(
      sampleRow({
        systemName: "SaaS Platform Primary",
        runLabel: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    );

    expect(group.label).toBe("SaaS Platform Primary");
  });

  it("uses review label when it is human-readable", () => {
    const group = resolveGovernanceFindingResourceGroup(
      sampleRow({
        runLabel: "Enterprise Customer Intake Modernization Review",
      }),
    );

    expect(group.label).toBe("Enterprise Customer Intake Modernization Review");
  });
});

describe("groupGovernanceFindingQueueRows", () => {
  it("clusters rows sharing the same resource id", () => {
    const resourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/shared-kv";

    const groups = groupGovernanceFindingQueueRows([
      sampleRow({ findingId: "a", resourceId, title: "Finding A" }),
      sampleRow({ findingId: "b", resourceId, title: "Finding B" }),
      sampleRow({ findingId: "c", systemName: "Other System", title: "Finding C" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.rows).toHaveLength(2);
    expect(groups[0]?.label).toBe(shortenResourceId(resourceId));
  });
});

describe("extractAzureResourceIdFromText", () => {
  it("returns null when no ARM id is present", () => {
    expect(extractAzureResourceIdFromText("PHI minimization risk")).toBeNull();
  });
});
