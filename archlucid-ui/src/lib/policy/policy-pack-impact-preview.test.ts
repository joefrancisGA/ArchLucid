import { describe, expect, it } from "vitest";

import {
  buildAfterAssignmentComplianceRuleKeys,
  buildPolicyImpactPreviewSimulateRequest,
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
