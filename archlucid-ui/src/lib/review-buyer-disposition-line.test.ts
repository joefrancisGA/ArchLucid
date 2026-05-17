import { describe, expect, it } from "vitest";

import {
  buildBuyerReviewPackageDispositionLine,
  buildBuyerReviewPackagePlainStatusHeadline,
  buyerHeaderStatusTwinPillCaption,
} from "./review-buyer-disposition-line";

describe("buildBuyerReviewPackagePlainStatusHeadline", () => {
  it("returns null before finalization", () => {
    expect(
      buildBuyerReviewPackagePlainStatusHeadline({
        hasGoldenManifest: false,
        findingCountDisplay: 9,
        warningCountDisplay: 1,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Passed",
        aggregateRiskPosture: "Approved with monitoring",
      }),
    ).toBeNull();
  });

  it("uses the PHI monitoring headline for the showcase-shaped finalized package", () => {
    expect(
      buildBuyerReviewPackagePlainStatusHeadline({
        hasGoldenManifest: true,
        findingCountDisplay: 9,
        warningCountDisplay: 1,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Passed",
        aggregateRiskPosture: "Approved with monitoring",
      }),
    ).toContain("Decision: Approved with monitoring");
  });
});

describe("buyerHeaderStatusTwinPillCaption", () => {
  it("uses the generic monitored-risk sentence when posture is approved with monitoring", () => {
    expect(
      buyerHeaderStatusTwinPillCaption({
        hasGoldenManifest: true,
        findingCountDisplay: 9,
        warningCountDisplay: 1,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Passed",
        aggregateRiskPosture: "Approved with monitoring",
      }),
    ).toContain("one non-blocking risk remains under explicit monitored oversight");
  });

  it("returns null when posture does not imply monitored approval", () => {
    expect(
      buyerHeaderStatusTwinPillCaption({
        hasGoldenManifest: true,
        findingCountDisplay: 9,
        warningCountDisplay: 0,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Pending",
        aggregateRiskPosture: "Low",
      }),
    ).toBeNull();
  });
});

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
    expect(line).toContain("governance gate Approved with monitoring");
    expect(line).toContain("9 findings");
    expect(line).toContain("non-blocking monitored risk");
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
