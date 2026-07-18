import { describe, expect, it } from "vitest";

import {
  BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL,
  BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
} from "@/lib/billing-meter-vocabulary";

describe("billing meter vocabulary", () => {
  it("uses architecture package as the buyer-facing billable unit noun", () => {
    expect(BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL).toContain("architecture packages");
    expect(BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL).toContain("architecture packages");
    expect(BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL).toBe("architecture package");
    expect(BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL).not.toMatch(/included reviews/i);
    expect(BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL).not.toMatch(/additional reviews/i);
  });
});
