import { describe, expect, it } from "vitest";

import {
  formatCompositeAlertRuleCreateConfirmationSummary,
  isCompositeAlertRuleFormValid,
  validateCompositeAlertRuleForm,
  type CompositeAlertRuleFormInput,
} from "@/lib/composite-alert-rules-form";

const validInput: CompositeAlertRuleFormInput = {
  name: "Cost + compliance composite",
  severity: "High",
  joinOperator: "And",
  suppressionWindowMinutes: 1440,
  cooldownMinutes: 60,
  dedupeScope: "RuleAndRun",
  condition1: {
    metricType: "CostIncreasePercent",
    operator: "GreaterThanOrEqual",
    thresholdValue: 10,
  },
  condition2: {
    metricType: "NewComplianceGapCount",
    operator: "GreaterThanOrEqual",
    thresholdValue: 1,
  },
};

describe("composite-alert-rules-form", () => {
  it("requires a name, valid thresholds, suppression/cooldown, and distinct metrics", () => {
    expect(validateCompositeAlertRuleForm(validInput)).toEqual({});
    expect(isCompositeAlertRuleFormValid(validInput)).toBe(true);
  });

  it("rejects empty name, invalid thresholds, and duplicate metrics", () => {
    const errors = validateCompositeAlertRuleForm({
      ...validInput,
      name: "   ",
      suppressionWindowMinutes: 0,
      cooldownMinutes: -1,
      condition1: { ...validInput.condition1, thresholdValue: Number.NaN },
      condition2: { ...validInput.condition2, metricType: validInput.condition1.metricType },
    });

    expect(errors.name).toMatch(/name/i);
    expect(errors.threshold1).toMatch(/numeric threshold/i);
    expect(errors.suppressionWindowMinutes).toMatch(/Suppression window/i);
    expect(errors.cooldownMinutes).toMatch(/Cooldown/i);
    expect(errors.metrics).toMatch(/different metrics/i);
    expect(isCompositeAlertRuleFormValid({ ...validInput, name: "" })).toBe(false);
  });

  it("formats a create confirmation summary from resolved condition labels", () => {
    const summary = formatCompositeAlertRuleCreateConfirmationSummary(validInput);

    expect(summary).toContain("Cost + compliance composite");
    expect(summary).toContain("all conditions (and)");
    expect(summary).toContain("Cost increase % ≥ 10");
    expect(summary).toContain("New compliance gap count (security deltas) ≥ 1");
  });
});
