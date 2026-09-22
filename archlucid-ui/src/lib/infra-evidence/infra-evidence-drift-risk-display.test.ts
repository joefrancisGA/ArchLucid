import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange, InfraEvidenceDiffSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  buildInfraEvidenceDriftRiskTooltip,
  formatInfraEvidenceDriftRiskLabel,
  isComparingTwoInventorySnapshots,
  isInfraEvidenceDriftRiskTooltipEligible,
  resolveInfraEvidenceDriftRiskKey,
} from "@/lib/infra-evidence/infra-evidence-drift-risk-display";

function buildDiff(
  snapshotAId: string,
  snapshotBId: string,
): InfraEvidenceDiffSummary {
  return {
    diffId: "diff-1",
    snapshotAId,
    snapshotBId,
    subscriptionId: "sub-1",
    totalChanges: 1,
    resourceAddedCount: 0,
    resourceRemovedCount: 1,
    resourceModifiedCount: 0,
    createdUtc: "2026-01-01T00:00:00Z",
  };
}

function buildChange(
  overrides: Partial<InfraEvidenceDiffChange> = {},
): InfraEvidenceDiffChange {
  return {
    changeId: "change-1",
    diffId: "diff-1",
    cloudResourceId: null,
    azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1",
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

describe("infra-evidence-drift-risk-display", () => {
  it("treats empty risk as none and unknown as unknown", () => {
    expect(resolveInfraEvidenceDriftRiskKey(null)).toBe("none");
    expect(resolveInfraEvidenceDriftRiskKey("")).toBe("none");
    expect(resolveInfraEvidenceDriftRiskKey("none")).toBe("none");
    expect(resolveInfraEvidenceDriftRiskKey("unknown")).toBe("unknown");
    expect(formatInfraEvidenceDriftRiskLabel("none")).toBe("None");
    expect(formatInfraEvidenceDriftRiskLabel("unknown")).toBe("Unknown");
  });

  it("labels classified drift risk and enables tooltip eligibility", () => {
    expect(formatInfraEvidenceDriftRiskLabel("elevated")).toBe("Elevated");
    expect(formatInfraEvidenceDriftRiskLabel("medium")).toBe("Medium");
    expect(isInfraEvidenceDriftRiskTooltipEligible("none")).toBe(false);
    expect(isInfraEvidenceDriftRiskTooltipEligible("unknown")).toBe(false);
    expect(isInfraEvidenceDriftRiskTooltipEligible("elevated")).toBe(true);
  });

  it("builds tooltip copy for classified risk rows", () => {
    const tooltip = buildInfraEvidenceDriftRiskTooltip(
      buildChange({
        riskClassification: "elevated",
        securitySignificance: "network-exposure",
        changeType: "NetworkExposureChanged",
        property: "publicNetworkAccess",
      }),
    );

    expect(tooltip).toContain("Elevated risk");
    expect(tooltip).toContain("Security significance: Network Exposure");
    expect(tooltip).toContain("Network exposure changed · publicNetworkAccess");
  });

  it("detects two-inventory snapshot comparison", () => {
    expect(
      isComparingTwoInventorySnapshots(
        buildDiff("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"),
      ),
    ).toBe(true);
    expect(
      isComparingTwoInventorySnapshots(
        buildDiff("11111111-1111-1111-1111-111111111111", "11111111-1111-1111-1111-111111111111"),
      ),
    ).toBe(false);
    expect(isComparingTwoInventorySnapshots(null)).toBe(false);
  });
});
