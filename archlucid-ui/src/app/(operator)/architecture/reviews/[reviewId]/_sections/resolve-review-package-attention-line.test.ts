import { describe, expect, it } from "vitest";

import { resolveReviewPackageAttentionLine } from "./resolve-review-package-attention-line";

describe("resolveReviewPackageAttentionLine", () => {
  it("prioritizes commit-blocking coverage over other signals", () => {
    const line = resolveReviewPackageAttentionLine({
      mode: "finalized",
      blockingFindingCount: 2,
      hasCommitBlockingFailures: true,
      proofPacketExportReady: true,
      hasGoldenManifest: true,
    });

    expect(line).toBe("Open blocking findings need review before finalization.");
  });

  it("guides draft reviews toward finalization", () => {
    const line = resolveReviewPackageAttentionLine({
      mode: "draft",
      blockingFindingCount: 0,
      hasCommitBlockingFailures: false,
      proofPacketExportReady: false,
      hasGoldenManifest: false,
    });

    expect(line).toBe("Finalize the review when findings and evidence are ready.");
  });

  it("surfaces blocking finding counts on finalized packages", () => {
    const line = resolveReviewPackageAttentionLine({
      mode: "finalized",
      blockingFindingCount: 2,
      hasCommitBlockingFailures: false,
      proofPacketExportReady: true,
      hasGoldenManifest: true,
    });

    expect(line).toBe("2 high-severity findings need review");
  });

  it("signals export readiness when proof packet is available", () => {
    const line = resolveReviewPackageAttentionLine({
      mode: "finalized",
      blockingFindingCount: 0,
      hasCommitBlockingFailures: false,
      proofPacketExportReady: true,
      hasGoldenManifest: true,
    });

    expect(line).toBe("Proof packet ready for export.");
  });

  it("returns null when no supported attention signal exists", () => {
    const line = resolveReviewPackageAttentionLine({
      mode: "finalized",
      blockingFindingCount: 0,
      hasCommitBlockingFailures: false,
      proofPacketExportReady: false,
      hasGoldenManifest: true,
    });

    expect(line).toBeNull();
  });
});
