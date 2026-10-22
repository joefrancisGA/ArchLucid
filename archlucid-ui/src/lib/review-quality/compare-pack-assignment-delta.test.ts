import { describe, expect, it } from "vitest";

import {
  buildCompareGovernanceDiffView,
  parseCompareManifestGovernanceSnapshot,
} from "@/lib/compare-effective-governance-diff";
import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { buildComparePackAssignmentDeltaView } from "@/lib/review-quality/compare-pack-assignment-delta";

describe("buildComparePackAssignmentDeltaView", () => {
  it("returns null when both sides lack pack assignment", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({}),
      targetManifest: parseCompareManifestGovernanceSnapshot({}),
      currentEffective: null,
    });

    expect(buildComparePackAssignmentDeltaView(view)).toBeNull();
  });

  it("summarizes at-commit pack ids and WK-21 honesty", () => {
    const view = buildCompareGovernanceDiffView({
      baselineManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-a",
        ruleSetVersion: "1.0.0",
        effectiveGovernanceAtCommit: {
          packAssignments: [
            {
              policyPackId: "pack-a",
              policyPackVersion: "1.0.0",
              scopeLevel: "Project",
            },
          ],
          hasEffectivePolicy: true,
        },
      }),
      targetManifest: parseCompareManifestGovernanceSnapshot({
        ruleSetId: "pack-b",
        ruleSetVersion: "2.0.0",
        effectiveGovernanceAtCommit: {
          packAssignments: [
            {
              policyPackId: "pack-b",
              policyPackVersion: "2.0.0",
              scopeLevel: "Project",
            },
          ],
          hasEffectivePolicy: true,
        },
      }),
      currentEffective: null,
    });

    const delta = buildComparePackAssignmentDeltaView(view);

    expect(delta?.baseline.summaryLine).toContain("pack-a@1.0.0");
    expect(delta?.target.summaryLine).toContain("pack-b@2.0.0");
    expect(delta?.changed).toBe(true);
    expect(delta?.wk21Line).toBe(POLICY_PACK_INFLUENCE_HONESTY_LINE);
  });
});
