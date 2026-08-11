import { describe, expect, it } from "vitest";

import {
  BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL,
  BILLING_CUSTOM_AI_ALLOWANCE_VALUE,
  BILLING_INCLUDED_AI_CREDITS_LABEL,
  BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL,
} from "@/lib/vocabulary/billing-meter-vocabulary";

describe("billing meter vocabulary", () => {
  it("uses architecture package as the buyer-facing billable unit noun", () => {
    expect(BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL).toContain("architecture packages");
    expect(BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL).toContain("architecture packages");
    expect(BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL).toBe("architecture package");
    expect(BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL).not.toMatch(/included reviews/i);
    expect(BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL).not.toMatch(/additional reviews/i);
  });

  it("keeps AI credits (plan catalog) and USD budget allowance labels distinct (TB-1168)", () => {
    expect(BILLING_INCLUDED_AI_CREDITS_LABEL).not.toBe(BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL);
    expect(BILLING_INCLUDED_AI_CREDITS_LABEL).toContain("credits");
    expect(BILLING_MONTHLY_AI_BUDGET_ALLOWANCE_LABEL.toLowerCase()).toContain("budget");
    expect(BILLING_CUSTOM_AI_ALLOWANCE_VALUE).not.toMatch(/\$/);
  });
});
