import { describe, expect, it } from "vitest";

import { formatSecurityEvidencePathRankLead } from "@/lib/security-evidence-path-rank-display";
import type { SecurityEvidencePathRankDetail } from "@/lib/security-evidence-path-types";

function rank(overrides: Partial<SecurityEvidencePathRankDetail> = {}): SecurityEvidencePathRankDetail {
  return {
    pathId: "path-1",
    snapshotId: "snapshot-1",
    rankOrder: 1,
    ruleVersion: "v1",
    technicalExposureScore: 1,
    privilegeDepthScore: 1,
    blastRadiusScore: 1,
    businessConsequenceScore: null,
    confidenceBandScore: 1,
    compositeSortScore: 1,
    explanationSummary: "",
    breakdownJson: "{}",
    pathKind: "network",
    pathConfidenceBand: "High",
    dimensionProse: {
      technicalExposure: "",
      privilegeDepth: "",
      blastRadius: "",
      businessConsequence: "",
      confidenceBand: "",
      overall: "",
    },
    computedUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("formatSecurityEvidencePathRankLead", () => {
  it("states when no rank explanation was stored", () => {
    expect(
      formatSecurityEvidencePathRankLead({
        ...rank(),
      }),
    ).toBe("Rank explanation was not stored.");
  });

  it("keeps a stored explanation", () => {
    expect(
      formatSecurityEvidencePathRankLead({
        ...rank({ explanationSummary: "Observed boundary crossing." }),
      }),
    ).toBe("Observed boundary crossing.");
  });
});
