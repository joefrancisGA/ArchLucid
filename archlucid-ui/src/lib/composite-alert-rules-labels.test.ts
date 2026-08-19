import { describe, expect, it } from "vitest";

import {
  compositeAlertRuleStatusKind,
  compositeAlertRuleStatusLabel,
  formatCompositeAlertConditionSummary,
  formatCompositeAlertRuleSummary,
  labelForCompositeAlertMetricType,
  labelForCompositeConditionOperator,
  labelForCompositeDedupeScope,
  labelForCompositeJoinOperator,
} from "@/lib/composite-alert-rules-labels";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

const sampleRule: CompositeAlertRule = {
  compositeRuleId: "composite-1",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "default",
  name: "Cost + compliance composite",
  severity: "High",
  operator: "And",
  isEnabled: true,
  suppressionWindowMinutes: 1440,
  cooldownMinutes: 60,
  reopenDeltaThreshold: 0,
  dedupeScope: "RuleAndRun",
  targetChannelType: "DigestOnly",
  createdUtc: "2026-01-01T00:00:00Z",
  conditions: [
    {
      conditionId: "condition-1",
      metricType: "CostIncreasePercent",
      operator: "GreaterThanOrEqual",
      thresholdValue: 10,
    },
    {
      conditionId: "condition-2",
      metricType: "NewComplianceGapCount",
      operator: "GreaterThanOrEqual",
      thresholdValue: 1,
    },
  ],
};

describe("composite-alert-rules-labels", () => {
  it("maps composite metric, operator, join, and dedupe enums to operator-safe labels", () => {
    expect(labelForCompositeAlertMetricType("CostIncreasePercent")).toBe("Cost increase %");
    expect(labelForCompositeConditionOperator("GreaterThanOrEqual")).toBe("≥");
    expect(labelForCompositeJoinOperator("And")).toBe("All conditions (AND)");
    expect(labelForCompositeDedupeScope("RuleAndRun")).toBe("Rule + review");
  });

  it("maps enabled state to Active / Paused labels and status kinds", () => {
    expect(compositeAlertRuleStatusLabel(true)).toBe("Active");
    expect(compositeAlertRuleStatusLabel(false)).toBe("Paused");
    expect(compositeAlertRuleStatusKind(true)).toBe("ready");
    expect(compositeAlertRuleStatusKind(false)).toBe("neutral");
  });

  it("formats persisted composite rule summaries without engineering enum strings", () => {
    expect(formatCompositeAlertRuleSummary(sampleRule)).toContain("All conditions (AND)");
    expect(formatCompositeAlertRuleSummary(sampleRule)).toContain("Alert priority: High");
    expect(formatCompositeAlertRuleSummary(sampleRule)).toContain("Dedupe: Rule + review");
    expect(formatCompositeAlertRuleSummary(sampleRule)).toContain("Created");
    expect(formatCompositeAlertRuleSummary(sampleRule)).not.toContain("GreaterThanOrEqual");
    expect(formatCompositeAlertRuleSummary(sampleRule)).not.toContain("RuleAndRun");
    expect(formatCompositeAlertRuleSummary(sampleRule)).not.toContain("Enabled:");
  });

  it("formats condition lines without engineering enum strings", () => {
    expect(formatCompositeAlertConditionSummary(sampleRule.conditions[0]!)).toBe("Cost increase % ≥ 10");
    expect(formatCompositeAlertConditionSummary(sampleRule.conditions[1]!)).toBe(
      "New compliance gap count (security deltas) ≥ 1",
    );
  });
});
