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
    ).toContain("Approved with monitoring");
    expect(
      buildBuyerReviewPackagePlainStatusHeadline({
        hasGoldenManifest: true,
        findingCountDisplay: 9,
        warningCountDisplay: 1,
        unresolvedIssueCountDisplay: 0,
        governanceGateLabel: "Passed",
        aggregateRiskPosture: "Approved with monitoring",
      }),
    ).not.toContain("controls documented");
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
    ).toContain("non-blocking monitored risk remains on the record");
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
    ).toContain("Finalize the review");
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

    expect(line).toContain("Finalized package — Approved with monitoring");
    expect(line).toContain("9 findings, including 1 non-blocking monitored risk");
  });

  it("does not invent a monitored risk count when warningCountDisplay is omitted", () => {
    const line = buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: true,
      findingCountDisplay: 9,
      warningCountDisplay: null,
      unresolvedIssueCountDisplay: 0,
      governanceGateLabel: "Passed",
      aggregateRiskPosture: "Approved with monitoring",
    });

    expect(line).toContain("Finalized package — Approved with monitoring");
    expect(line).not.toContain("with 1 monitored risk");
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

  it("does not claim approval complete when risk posture was omitted", () => {
    const line = buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: true,
      findingCountDisplay: 2,
      warningCountDisplay: 0,
      unresolvedIssueCountDisplay: 0,
      governanceGateLabel: "Passed",
      aggregateRiskPosture: null,
    });

    expect(line).toContain("risk posture was not stored");
    expect(line).not.toContain("approval complete");
  });

  it("does not claim no blocking items when unresolved count was omitted", () => {
    const line = buildBuyerReviewPackageDispositionLine({
      hasGoldenManifest: true,
      findingCountDisplay: 4,
      warningCountDisplay: 0,
      unresolvedIssueCountDisplay: null,
      governanceGateLabel: "Passed",
      aggregateRiskPosture: "Low",
    });

    expect(line).toContain("unresolved issue count was not stored");
    expect(line).not.toContain("no blocking items");
  });
});
