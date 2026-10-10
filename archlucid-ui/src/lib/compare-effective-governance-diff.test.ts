import { describe, expect, it } from "vitest";

import {
  buildCompareEffectiveGovernanceSnapshot,
  buildCompareGovernanceDiffView,
  diffCompareManifestRuleSets,
  parseCompareManifestGovernanceSnapshot,
} from "@/lib/compare-effective-governance-diff";
import type { EffectivePolicyPackSet, PolicyPackContentDocument } from "@/types/policy-packs";

describe("compare-effective-governance-diff", () => {
  it("parses rule set fields from golden manifest wire", () => {
    const snapshot = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "healthcare-claims-v3",
      ruleSetVersion: "3.4.1",
      policy: { complianceRuleKeys: ["sec-base-010", "net-base-001"] },
    });

    expect(snapshot.ruleSetId).toBe("healthcare-claims-v3");
    expect(snapshot.ruleSetVersion).toBe("3.4.1");
    expect(snapshot.complianceRuleKeyCount).toBe(2);
  });

  it("detects manifest rule set changes", () => {
    const baseline = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "pack-a",
      ruleSetVersion: "1.0.0",
    });
    const target = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "pack-b",
      ruleSetVersion: "2.0.0",
    });

    const changes = diffCompareManifestRuleSets(baseline, target);

    expect(changes).toHaveLength(2);
    expect(changes[0]?.field).toBe("ruleSetId");
    expect(changes[1]?.field).toBe("ruleSetVersion");
  });

  it("parses effectiveGovernanceAtCommit from golden manifest wire", () => {
    const snapshot = parseCompareManifestGovernanceSnapshot({
      ruleSetId: "pack-a",
      ruleSetVersion: "1.0.0",
      effectiveGovernanceAtCommit: {
        generatedUtc: "2026-06-27T12:00:00Z",
        ruleSetHash: "hash-1",
        complianceRuleKeyCount: 1,
        complianceRuleKeys: ["sec-base-010"],
        conflictCount: 0,
        packAssignments: [
          {
            policyPackId: "11111111-1111-1111-1111-111111111111",
            policyPackVersion: "1.0.0",
            scopeLevel: "Project",
          },
        ],
        hasEffectivePolicy: true,
      },
    });

    expect(snapshot.atCommit?.hasEffectivePolicy).toBe(true);
    expect(snapshot.atCommit?.packAssignments).toHaveLength(1);
    expect(snapshot.complianceRuleKeys).toEqual(["sec-base-010"]);
  });

  it("preserves stored empty governance strings and explains omitted values", () => {
    const snapshot = parseCompareManifestGovernanceSnapshot({
      effectiveGovernanceAtCommit: {
        packAssignments: [{ policyPackId: "pack-a", policyPackVersion: "" }],
        coverageAssignments: [
          {
            policyPackId: "pack-a",
            policyPackVersion: "",
            coverageType: "Unknown",
            selectionState: "",
            qualityDimension: "",
          },
        ],
        hasEffectivePolicy: true,
      },
    });

    expect(snapshot.atCommit?.packAssignments[0]?.policyPackVersion).toBe("");
    expect(snapshot.atCommit?.coverageAssignments[0]).toMatchObject({
      policyPackVersion: "",
      coverageType: "Unknown",
      selectionState: "",
      qualityDimension: "",
    });

    const omitted = parseCompareManifestGovernanceSnapshot({
      effectiveGovernanceAtCommit: {
        packAssignments: [{ policyPackId: "pack-a" }],
        coverageAssignments: [{ policyPackId: "pack-a" }],
        hasEffectivePolicy: true,
      },
    });

    expect(omitted.atCommit?.packAssignments[0]?.policyPackVersion).toBe("Policy pack version was not stored.");
    expect(omitted.atCommit?.coverageAssignments[0]).toMatchObject({
      policyPackVersion: "Policy pack version was not stored.",
      coverageType: "Coverage type was not stored.",
      selectionState: "Selection state was not stored.",
      qualityDimension: "Quality dimension was not stored.",
    });
  });

  it("preserves omitted governance counts separately from stored zero", () => {
    const omitted = parseCompareManifestGovernanceSnapshot({
      effectiveGovernanceAtCommit: { hasEffectivePolicy: true },
    });
    const emptyKeys = parseCompareManifestGovernanceSnapshot({
      effectiveGovernanceAtCommit: { hasEffectivePolicy: true, complianceRuleKeys: [] },
    });
    const storedZero = parseCompareManifestGovernanceSnapshot({
      effectiveGovernanceAtCommit: {
        hasEffectivePolicy: true,
        complianceRuleKeyCount: 0,
        conflictCount: 0,
      },
    });

    expect(omitted.atCommit?.complianceRuleKeyCount).toBeNull();
    expect(omitted.atCommit?.conflictCount).toBeNull();
    expect(emptyKeys.atCommit?.complianceRuleKeyCount).toBe(0);
    expect(storedZero.atCommit?.complianceRuleKeyCount).toBe(0);
    expect(storedZero.atCommit?.conflictCount).toBe(0);
  });

  it("prefers policy-at-commit keys over current effective in diff view", () => {
    const effective: EffectivePolicyPackSet = {
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      packs: [],
    };
    const content: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["current-only-key"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: {},
    };

    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 1,
          complianceRuleKeys: ["sec-base-010"],
          conflictCount: 0,
          packAssignments: [],
          hasEffectivePolicy: true,
        },
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
        effectiveGovernanceAtCommit: {
          complianceRuleKeyCount: 2,
          complianceRuleKeys: ["sec-base-010", "net-base-001"],
          conflictCount: 0,
          packAssignments: [],
          hasEffectivePolicy: true,
        },
      }),
      currentEffective: buildCompareEffectiveGovernanceSnapshot(effective, content),
    });

    expect(view.usesCurrentEffectiveOnly).toBe(false);
    expect(view.materialComplianceRuleKeyChanges).toHaveLength(1);
  });

  it("builds governance diff view with current-effective disclaimer path", () => {
    const effective: EffectivePolicyPackSet = {
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      packs: [
        {
          policyPackId: "pack-a",
          name: "Pack A",
          version: "1.0.0",
          packType: "PlatformDefault",
          contentJson: "{}",
        },
      ],
    };
    const content: PolicyPackContentDocument = {
      complianceRuleIds: [],
      complianceRuleKeys: ["sec-base-010", "net-base-001"],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: {},
    };

    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
      }),
      currentEffective: buildCompareEffectiveGovernanceSnapshot(effective, content),
    });

    expect(view.usesCurrentEffectiveOnly).toBe(true);
    expect(view.manifestRuleSetChanges).toHaveLength(0);
    expect(view.currentEffective?.complianceRuleKeyCount).toBe(2);
  });
});
