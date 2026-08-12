import { describe, expect, it } from "vitest";

import {
  buildGovernanceResolutionMarkdown,
  governanceResolutionMarkdownFilename,
} from "@/lib/governance-resolution-markdown";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

const emptyContent: EffectiveGovernanceResolutionResult["effectiveContent"] = {
  complianceRuleIds: [],
  complianceRuleKeys: [],
  alertRuleIds: [],
  compositeAlertRuleIds: [],
  advisoryDefaults: {},
  metadata: {},
};

function minimalResult(
  partial: Partial<EffectiveGovernanceResolutionResult> = {},
): EffectiveGovernanceResolutionResult {
  return {
    tenantId: "t-1",
    workspaceId: "w-1",
    projectId: "p-1",
    effectiveContent: emptyContent,
    decisions: [],
    conflicts: [],
    notes: ["Pack count: 2"],
    ...partial,
  };
}

describe("governance-resolution-markdown", () => {
  it("includes point-in-time snapshot banner and scope ids", () => {
    const exportedAt = new Date("2026-05-19T12:00:00.000Z");
    const md = buildGovernanceResolutionMarkdown(minimalResult(), exportedAt);

    expect(md).toContain("Point-in-time export");
    expect(md).toContain("2026-05-19T12:00:00.000Z");
    expect(md).toContain("`p-1`");
    expect(md).toContain("Pack count: 2");
  });

  it("renders conflict and decision sections", () => {
    const md = buildGovernanceResolutionMarkdown(
      minimalResult({
        conflicts: [
          {
            itemType: "Metadata",
            itemKey: "tier",
            conflictType: "ValueConflict",
            description: "Values disagreed.",
            candidates: [
              {
                policyPackId: "pack-a",
                policyPackName: "Project pack",
                version: "1.0.0",
                scopeLevel: "Project",
                precedenceRank: 300,
                wasSelected: true,
                valueJson: "\"project\"",
                assignmentId: "a-1",
                assignedUtc: "2026-01-02T00:00:00Z",
              },
              {
                policyPackId: "pack-b",
                policyPackName: "Tenant pack",
                version: "1.0.0",
                scopeLevel: "Tenant",
                precedenceRank: 100,
                wasSelected: false,
                valueJson: "\"tenant\"",
                assignmentId: "a-2",
                assignedUtc: "2026-01-01T00:00:00Z",
              },
            ],
          },
        ],
        decisions: [
          {
            itemType: "Metadata",
            itemKey: "tier",
            winningPolicyPackId: "pack-a",
            winningPolicyPackName: "Project pack",
            winningVersion: "1.0.0",
            winningScopeLevel: "Project",
            resolutionReason: "Project scope outranked tenant.",
            candidates: [],
          },
        ],
      }),
      new Date("2026-05-19T12:00:00.000Z"),
    );

    expect(md).toContain("ValueConflict");
    expect(md).toContain("Project pack");
    expect(md).toContain("Tenant pack");
    expect(md).toContain("Project scope outranked tenant.");
  });

  it("builds a safe filename from project id", () => {
    expect(governanceResolutionMarkdownFilename("proj/with spaces")).toBe("governance-resolution-proj-with-spaces.md");
  });
});
