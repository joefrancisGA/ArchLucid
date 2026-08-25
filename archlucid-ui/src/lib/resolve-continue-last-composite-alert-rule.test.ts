import { describe, expect, it } from "vitest";

import { resolveContinueLastCompositeAlertRule } from "@/lib/resolve-continue-last-composite-alert-rule";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

function rule(overrides: Partial<CompositeAlertRule> = {}): CompositeAlertRule {
  return {
    compositeRuleId: "composite-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    name: "Cost + compliance",
    severity: "High",
    operator: "And",
    isEnabled: true,
    suppressionWindowMinutes: 1440,
    cooldownMinutes: 60,
    reopenDeltaThreshold: 0,
    dedupeScope: "RuleAndRun",
    targetChannelType: "AlertRouting",
    createdUtc: "2026-08-01T00:00:00.000Z",
    conditions: [],
    ...overrides,
  };
}

describe("resolveContinueLastCompositeAlertRule", () => {
  it("falls back to the newest created rule when no stored id exists", () => {
    window.localStorage.removeItem("archlucid_composite_alert_rule_continue_last_v1");

    const match = resolveContinueLastCompositeAlertRule([
      rule({ compositeRuleId: "old", name: "Old", createdUtc: "2026-01-01T00:00:00.000Z" }),
      rule({ compositeRuleId: "new", name: "New", createdUtc: "2026-08-01T00:00:00.000Z" }),
    ]);

    expect(match?.ruleId).toBe("new");
    expect(match?.name).toBe("New");
  });

  it("prefers the stored rule id when it is still in the list", () => {
    window.localStorage.setItem("archlucid_composite_alert_rule_continue_last_v1", "old");

    const match = resolveContinueLastCompositeAlertRule([
      rule({ compositeRuleId: "old", name: "Old", createdUtc: "2026-01-01T00:00:00.000Z" }),
      rule({ compositeRuleId: "new", name: "New", createdUtc: "2026-08-01T00:00:00.000Z" }),
    ]);

    expect(match?.ruleId).toBe("old");
    expect(match?.name).toBe("Old");
  });
});
