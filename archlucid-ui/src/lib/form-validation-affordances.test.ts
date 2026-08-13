import { describe, expect, it } from "vitest";

import {
  validatePilotBaselineManualStep,
  validatePilotBaselineReviewStep,
} from "@/lib/pilot-baseline-wizard-validation";
import { validateTenantCostSettingsFields } from "@/lib/tenant-cost-settings-validation";

describe("pilot-baseline-wizard-validation", () => {
  it("requires positive review hours for step one", () => {
    expect(validatePilotBaselineReviewStep("", "").valid).toBe(false);
    expect(validatePilotBaselineReviewStep("24", "").valid).toBe(true);
  });

  it("requires positive manual prep for step two", () => {
    expect(validatePilotBaselineManualStep("", "").valid).toBe(false);
    expect(validatePilotBaselineManualStep("8", "").valid).toBe(true);
  });
});

describe("tenant-cost-settings-validation", () => {
  it("rejects non-positive USD amounts and out-of-range EA discount", () => {
    expect(validateTenantCostSettingsFields("0", "25000", "0").valid).toBe(false);
    expect(validateTenantCostSettingsFields("150", "25000", "101").valid).toBe(false);
    expect(validateTenantCostSettingsFields("150", "25000", "15").valid).toBe(true);
  });
});
