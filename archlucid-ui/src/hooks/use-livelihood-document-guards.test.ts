import { describe, expect, it } from "vitest";

import { alertRuleFormDiffersFromDefaultDraft, ALERT_RULE_FORM_DEFAULT_DRAFT } from "@/lib/alert-rule-conditions";

describe("livelihood document dirty predicates", () => {
  it("treats a default alert-rule create form as clean", () => {
    expect(alertRuleFormDiffersFromDefaultDraft(ALERT_RULE_FORM_DEFAULT_DRAFT)).toBe(false);
  });

  it("treats a named alert-rule create form as dirty for navigation guards", () => {
    expect(
      alertRuleFormDiffersFromDefaultDraft({
        ...ALERT_RULE_FORM_DEFAULT_DRAFT,
        name: "High-severity findings",
      }),
    ).toBe(true);
  });
});
