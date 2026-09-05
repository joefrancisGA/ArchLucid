import { describe, expect, it } from "vitest";

import type { ManifestSummary } from "@/types/authority";

import {
  manifestSummarySealedVersionForCopyGuard,
  runCollateralSealedManifestCopyBlockedReason,
} from "@/lib/runs/run-collateral-sealed-manifest-guard";

const committedSummary: ManifestSummary = {
  manifestId: "manifest-1",
  runId: "run-1",
  createdUtc: "2026-01-01T00:00:00Z",
  manifestHash: "hash",
  ruleSetId: "pack",
  ruleSetVersion: "1.0.0",
  decisionCount: 1,
  warningCount: 0,
  unresolvedIssueCount: 0,
  status: "Committed",
};

describe("run-collateral-sealed-manifest-guard", () => {
  it("blocks when manifest version is missing", () => {
    expect(
      runCollateralSealedManifestCopyBlockedReason({
        runId: "run-1",
        manifestVersion: null,
      }),
    ).toContain("committed sealed manifest");
  });

  it("allows when run id and manifest version are present", () => {
    expect(
      runCollateralSealedManifestCopyBlockedReason({
        runId: "run-1",
        manifestVersion: "v12",
      }),
    ).toBeNull();
  });

  it("derives sealed version from committed manifest summary", () => {
    expect(manifestSummarySealedVersionForCopyGuard(committedSummary)).toBe("manifest-1");
    expect(manifestSummarySealedVersionForCopyGuard({ ...committedSummary, status: "Draft" })).toBeNull();
  });
});
