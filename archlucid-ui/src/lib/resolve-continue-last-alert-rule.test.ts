import { describe, expect, it } from "vitest";

import { resolveContinueLastAlertRule } from "@/lib/resolve-continue-last-alert-rule";
import type { AlertRule } from "@/types/alerts";

function rule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    ruleId: "rule-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    name: "Cost increase",
    ruleType: "CostIncreasePercent",
    severity: "High",
    thresholdValue: 10,
    isEnabled: true,
    targetChannelType: "Email",
    metadataJson: "{}",
    createdUtc: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveContinueLastAlertRule", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastAlertRule(null)).toBeNull();
    expect(resolveContinueLastAlertRule({})).toBeNull();
    expect(resolveContinueLastAlertRule("nope")).toBeNull();
    expect(resolveContinueLastAlertRule([])).toBeNull();
  });

  it("falls back to the newest created rule when no stored id exists", () => {
    const match = resolveContinueLastAlertRule([
      rule({ ruleId: "old", name: "Old", createdUtc: "2026-01-01T00:00:00.000Z" }),
      rule({ ruleId: "new", name: "New", createdUtc: "2026-08-01T00:00:00.000Z" }),
    ]);

    expect(match?.ruleId).toBe("new");
    expect(match?.name).toBe("New");
  });

  it("orders rules by instant and ignores unreadable creation timestamps", () => {
    const match = resolveContinueLastAlertRule([
      rule({ ruleId: "invalid", name: "Invalid", createdUtc: "not-a-timestamp" }),
      rule({ ruleId: "older", name: "Older", createdUtc: "2026-08-20T01:00:00+02:00" }),
      rule({ ruleId: "newer", name: "Newer", createdUtc: "2026-08-20T00:30:00Z" }),
    ]);

    expect(match?.ruleId).toBe("newer");
  });
});
