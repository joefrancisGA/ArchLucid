import { describe, expect, it } from "vitest";

import {
  buildCommittedCoverageScopeLine,
  buildCommittedPolicyPackEvaluationHeadline,
} from "@/lib/policy/committed-coverage-scope-summary";

describe("committed-coverage-scope-summary", () => {
  it("buildCommittedCoverageScopeLine groups active coverage rows", () => {
    const line = buildCommittedCoverageScopeLine({
      generatedUtc: null,
      ruleSetHash: null,
      complianceRuleKeyCount: 0,
      complianceRuleKeys: [],
      conflictCount: 0,
      hasEffectivePolicy: true,
      packAssignments: [],
      coverageAssignments: [
        {
          policyPackId: "1",
          policyPackVersion: "1.0.0",
          coverageType: "ProviderNeutralBaseline",
          selectionState: "AlwaysActive",
          qualityDimension: "Security",
          exclusionReason: null,
        },
        {
          policyPackId: "2",
          policyPackVersion: "1.0.0",
          coverageType: "OrganizationRequired",
          selectionState: "RequiredAndLocked",
          qualityDimension: null,
          exclusionReason: null,
        },
        {
          policyPackId: "3",
          policyPackVersion: "1.0.0",
          coverageType: "AdditionalOptional",
          selectionState: "RecommendedButExcluded",
          qualityDimension: null,
          exclusionReason: "Focused pilot",
        },
      ],
    });

    expect(line).toBe("Committed coverage: 1 baseline quality dimension, 1 organization-required pack.");
  });

  it("buildCommittedPolicyPackEvaluationHeadline uses multi-pack wording", () => {
    const headline = buildCommittedPolicyPackEvaluationHeadline({
      ruleSetId: "legacy-pack",
      ruleSetVersion: "1.0.0",
      packLabel: "Legacy Pack",
      effectiveGovernanceAtCommit: {
        generatedUtc: null,
        ruleSetHash: null,
        complianceRuleKeyCount: 0,
        complianceRuleKeys: [],
        conflictCount: 0,
        hasEffectivePolicy: true,
        packAssignments: [
          { policyPackId: "a", policyPackVersion: "1", scopeLevel: "Project" },
          { policyPackId: "b", policyPackVersion: "1", scopeLevel: "Project" },
        ],
        coverageAssignments: [
          {
            policyPackId: "a",
            policyPackVersion: "1",
            coverageType: "ProviderNeutralBaseline",
            selectionState: "AlwaysActive",
            qualityDimension: "Security",
            exclusionReason: null,
          },
          {
            policyPackId: "b",
            policyPackVersion: "1",
            coverageType: "PlatformOverlay",
            selectionState: "RecommendedAndSelected",
            qualityDimension: null,
            exclusionReason: null,
          },
        ],
      },
    });

    expect(headline).toContain("2 committed policy packs");
    expect(headline).toContain("baseline quality dimension");
    expect(headline).toContain("platform overlay");
  });
});
