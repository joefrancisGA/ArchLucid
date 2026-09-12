import { describe, expect, it } from "vitest";

import {
  buildAfterAssignmentComplianceRuleKeys,
  buildPolicyImpactPreviewSimulateRequest,
  resolveInitialPackComparisonIds,
  resolvePolicyPackDisplayName,
  summarizePolicyImpactGateResult,
} from "@/lib/policy/policy-pack-impact-preview";

describe("buildPolicyImpactPreviewSimulateRequest", () => {
  it("maps allow posture to non-blocking simulate request", () => {
    expect(buildPolicyImpactPreviewSimulateRequest("run-1", "allow")).toEqual({
      runId: "run-1",
      blockCommitOnCritical: false,
    });
  });

  it("maps block-warning posture to minimum severity 1", () => {
    expect(buildPolicyImpactPreviewSimulateRequest("run-1", "block-warning")).toEqual({
      runId: "run-1",
      blockCommitOnCritical: true,
      blockCommitMinimumSeverity: 1,
    });
  });
});

describe("buildAfterAssignmentComplianceRuleKeys", () => {
  it("unions effective and proposed pack keys", () => {
    expect(
      buildAfterAssignmentComplianceRuleKeys(
        { complianceRuleKeys: ["alpha"] },
        { complianceRuleKeys: ["beta", "alpha"] },
      ),
    ).toEqual(["alpha", "beta"]);
  });
});

describe("resolveInitialPackComparisonIds", () => {
  it("defaults pack A to selected pack and pack B to a different pack", () => {
    expect(
      resolveInitialPackComparisonIds(
        [
          { policyPackId: "pack-a", name: "Pack A" },
          { policyPackId: "pack-b", name: "Pack B" },
        ] as never,
        "pack-a",
      ),
    ).toEqual({ packAId: "pack-a", packBId: "pack-b" });
  });

  it("prefers URL pack ids when they match published packs", () => {
    expect(
      resolveInitialPackComparisonIds(
        [
          { policyPackId: "pack-a", name: "Pack A" },
          { policyPackId: "pack-b", name: "Pack B" },
        ] as never,
        "pack-a",
        "pack-b",
        "pack-a",
      ),
    ).toEqual({ packAId: "pack-b", packBId: "pack-a" });
  });
});

describe("resolvePolicyPackDisplayName", () => {
  it("prefers pack name over id", () => {
    expect(
      resolvePolicyPackDisplayName([{ policyPackId: "pack-a", name: "Alpha baseline" }] as never, "pack-a"),
    ).toBe("Alpha baseline");
  });
});

describe("summarizePolicyImpactGateResult", () => {
  it("reports blocked gate for stricter posture", () => {
    const summary = summarizePolicyImpactGateResult("block-critical", {
      gateResult: { blocked: true, warnOnly: false },
      failedChecks: ["critical-finding"],
    });

    expect(summary.blocked).toBe(true);
    expect(summary.failedCheckCount).toBe(1);
    expect(summary.label).toContain("Critical");
  });
});
