import { describe, expect, it } from "vitest";

import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

import {
  computeRemediationFactoryRankedPathViewCounts,
  remediationFactoryRankedPathViewFilteredCount,
} from "./remediation-factory-ranked-path-view-counts";

const baseRow = (overrides: Partial<SecurityEvidencePathRankSummary>): SecurityEvidencePathRankSummary => ({
  pathId: "path-1",
  snapshotId: "snap-1",
  rankOrder: 1,
  ruleVersion: "v1",
  technicalExposureScore: 0.5,
  privilegeDepthScore: 0.5,
  blastRadiusScore: 0.5,
  businessConsequenceScore: null,
  confidenceBandScore: 0.5,
  compositeSortScore: 0.5,
  explanationSummary: "summary",
  pathKind: "PrivilegePath",
  pathConfidenceBand: "HighlyLikely",
  computedUtc: "2026-01-01T00:00:00Z",
  relatedCutPoints: [],
  ...overrides,
});

describe("remediation-factory-ranked-path-view-counts", () => {
  it("counts filtered path views on the current page", () => {
    const counts = computeRemediationFactoryRankedPathViewCounts([
      baseRow({ pathKind: "ReachabilityPath" }),
      baseRow({ pathId: "path-2", pathKind: "PrivilegePath" }),
      baseRow({
        pathId: "path-3",
        pathKind: "NetworkPath",
        pathConfidenceBand: "InsufficientEvidence",
      }),
    ]);

    expect(counts.all).toBe(3);
    expect(counts.publicExposure).toBe(1);
    expect(counts.privilege).toBe(1);
    expect(counts.insufficientEvidence).toBe(1);
    expect(remediationFactoryRankedPathViewFilteredCount("privilege", counts)).toBe(1);
  });
});
