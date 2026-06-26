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
