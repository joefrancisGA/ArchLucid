import { describe, expect, it } from "vitest";

import { buildBuyerReviewPackageDispositionLine } from "./review-buyer-disposition-line";

describe("buildBuyerReviewPackageDispositionLine", () => {
  it("prompts finalization when manifest is not golden", () => {
    expect(
      buildBuyerReviewPackageDispositionLine({
        hasGoldenManifest: false,
        findingCountDisplay: 9,
        warningCountDisplay: 1,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Passed",
        aggregateRiskPosture: "Approved with monitoring",
      }),
    ).toContain("Finalize the reviewed manifest");
  });

  it("joins posture, gate, findings, and warnings for a finalized showcase-shaped package", () => {
    const line = buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: true,
      findingCountDisplay: 9,
      warningCountDisplay: 1,
      unresolvedIssueCountDisplay: 0,
      governanceGateLabel: "Passed",
      aggregateRiskPosture: "Approved with monitoring",
    });

    expect(line).toContain("Approved with monitoring");
    expect(line).toContain("governance gate Passed");
    expect(line).toContain("9 findings");
    expect(line).toContain("non-blocking warning");
  });

  it("surfaces unresolved manifest issues when present", () => {
    const line = buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: true,
      findingCountDisplay: 4,
      warningCountDisplay: 0,
      unresolvedIssueCountDisplay: 2,
      governanceGateLabel: "Pending",
      aggregateRiskPosture: null,
    });

    expect(line).toContain("2 unresolved issues");
  });
});
