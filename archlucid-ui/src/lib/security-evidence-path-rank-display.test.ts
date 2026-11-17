import { describe, expect, it } from "vitest";

import { formatSecurityEvidencePathRankLead } from "@/lib/security-evidence-path-rank-display";
import type { SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

function baseRank(overrides: Partial<SecurityEvidencePathRankDetail>): SecurityEvidencePathRankDetail {
  return {
    pathId: "path-1",
    snapshotId: "snap-1",
    rankOrder: 1,
    ruleVersion: "1",
    technicalExposureScore: null,
    privilegeDepthScore: null,
    blastRadiusScore: null,
    businessConsequenceScore: null,
    confidenceBandScore: null,
    compositeSortScore: null,
    explanationSummary: "Rank explanation summary was not stored.",
    pathKind: "Privilege",
    pathConfidenceBand: "Probable",
    computedUtc: "2025-01-01T00:00:00Z",
    breakdownJson: "Rank breakdown was not stored.",
    dimensionProse: {
      technicalExposure: "",
      privilegeDepth: "",
      blastRadius: "",
      businessConsequence: "",
      confidenceBand: "",
      overall: "Overall prose from dimension store.",
    },
    nextStoredPathRankContext: "",
    ...overrides,
  };
}

describe("formatSecurityEvidencePathRankLead", () => {
  it("falls back to overall dimension prose when summary is omission copy", () => {
    expect(formatSecurityEvidencePathRankLead(baseRank({}))).toBe("Overall prose from dimension store.");
  });
});