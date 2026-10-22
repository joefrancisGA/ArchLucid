import { describe, expect, it } from "vitest";

import { formatInfraEvidenceDriftChangedByLabel } from "@/lib/infra-evidence/infra-evidence-drift-change-attribution";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";

function buildChange(overrides: Partial<InfraEvidenceDiffChange> = {}): InfraEvidenceDiffChange {
  return {
    changeId: "change-1",
    diffId: "diff-1",
    cloudResourceId: null,
    azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
    changeType: 2,
    property: "sku",
    oldValue: null,
    newValue: null,
    riskClassification: null,
    securitySignificance: null,
    architectureSignificance: null,
    evidenceReference: null,
    changedByDisplayName: null,
    changedByKind: null,
    ...overrides,
  };
}

describe("infra-evidence-drift-change-attribution", () => {
  it("formats changed-by display name when present", () => {
    expect(
      formatInfraEvidenceDriftChangedByLabel(
        buildChange({ changedByDisplayName: "ci-runner", changedByKind: "servicePrincipal" }),
      ),
    ).toBe("ci-runner");
  });

  it("returns null when changed-by is missing", () => {
    expect(formatInfraEvidenceDriftChangedByLabel(buildChange())).toBeNull();
  });
});
