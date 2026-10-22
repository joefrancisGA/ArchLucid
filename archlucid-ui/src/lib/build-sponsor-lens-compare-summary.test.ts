import { describe, expect, it } from "vitest";

import {
  buildSponsorLensCompareSummary,
  SPONSOR_LENS_INSUFFICIENT_DATA_MESSAGE,
} from "@/lib/build-sponsor-lens-compare-summary";
import type { GoldenManifestComparison } from "@/types/comparison";

const goldenWithFindingDelta: GoldenManifestComparison = {
  baseRunId: "base",
  targetRunId: "target",
  decisionChanges: [{ decisionKey: "region", baseValue: "east", targetValue: "west", changeType: "Modified" }],
  requirementChanges: [],
  securityChanges: [{ findingKey: "f-1", baseSeverity: "High", targetSeverity: "Critical", changeType: "Escalated" }],
  topologyChanges: [],
  costChanges: [],
  summaryHighlights: [],
};

describe("buildSponsorLensCompareSummary", () => {
  it("returns insufficient-data path when golden is null", () => {
    const summary = buildSponsorLensCompareSummary({
      golden: null,
      executionModeHonesty: null,
      governanceDiff: null,
    });

    expect(summary.insufficientData).toBe(true);
    expect(summary.insufficientMessage).toBe(SPONSOR_LENS_INSUFFICIENT_DATA_MESSAGE);
    expect(summary.bullets).toEqual([]);
  });

  it("produces at most three stable sponsor bullets from compare model", () => {
    const summary = buildSponsorLensCompareSummary({
      golden: goldenWithFindingDelta,
      executionModeHonesty: {
        baselineMode: "Synthetic",
        updatedMode: "Real",
        modesDiffer: true,
        anyNonReal: true,
        advisoryParagraph: "Modes differ.",
        modeUnavailable: false,
      },
      governanceDiff: {
        baselineManifest: {
          ruleSetId: null,
          ruleSetVersion: null,
          complianceRuleKeyCount: null,
          complianceRuleKeys: [],
          atCommit: null,
        },
        targetManifest: {
          ruleSetId: "rs",
          ruleSetVersion: "2",
          complianceRuleKeyCount: 2,
          complianceRuleKeys: ["a", "b"],
          atCommit: null,
        },
        manifestRuleSetChanges: [],
        currentEffective: null,
        usesCurrentEffectiveOnly: true,
        complianceRuleKeyDiff: [],
        materialComplianceRuleKeyChanges: [{ key: "a", changeType: "Added" }],
        hasManifestGovernanceDelta: true,
      },
    });

    expect(summary.insufficientData).toBe(false);
    expect(summary.bullets.length).toBeLessThanOrEqual(3);
    expect(summary.bullets[0]).toContain("finding or posture shift");
    expect(summary.bullets.some((bullet) => bullet.includes("architecture decision"))).toBe(true);
    expect(summary.bullets.some((bullet) => bullet.includes("compliance rule"))).toBe(true);
  });
});
