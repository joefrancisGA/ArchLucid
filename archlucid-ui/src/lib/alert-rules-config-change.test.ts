import { describe, expect, it } from "vitest";

import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import type { AlertRule } from "@/types/alerts";

function rule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    ruleId: "rule-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "default",
    name: "Workspace watch",
    ruleType: "CriticalRecommendationCount",
    severity: "High",
    thresholdValue: 2,
    isEnabled: true,
    targetChannelType: "DigestOnly",
    metadataJson: "{}",
    createdUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("latestAlertRulesConfigChange", () => {
  it("returns null when no rules exist", () => {
    expect(latestAlertRulesConfigChange([])).toBeNull();
  });

  it("returns the latest createdUtc across rules without inventing an actor", () => {
    expect(
      latestAlertRulesConfigChange([
        rule({ ruleId: "older", createdUtc: "2026-01-01T00:00:00Z" }),
        rule({ ruleId: "newer", createdUtc: "2026-06-15T12:00:00Z" }),
      ]),
    ).toEqual({
      recordedUtc: "2026-06-15T12:00:00Z",
      actor: null,
    });
  });
});
