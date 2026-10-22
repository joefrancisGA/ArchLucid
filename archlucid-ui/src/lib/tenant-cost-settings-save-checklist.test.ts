import { describe, expect, it } from "vitest";

import {
  resolveTenantCostSettingsSaveEmphasizedStepId,
  resolveTenantCostSettingsSaveSteps,
} from "@/lib/tenant-cost-settings-save-checklist";

describe("tenant-cost-settings-save-checklist", () => {
  it("marks checklist steps complete for configured tenants with valid fields", () => {
    expect(
      resolveTenantCostSettingsSaveSteps({
        isTenantConfigured: true,
        ratesValid: true,
        eaDiscountValid: true,
        saveComplete: false,
      }),
    ).toEqual([
      { id: "fields", label: "Enter architect rate and incident cost", complete: true },
      { id: "ea-discount", label: "Confirm EA discount percentage", complete: true },
      { id: "save", label: "Save cost settings", complete: false },
    ]);
  });

  it("leaves checklist steps pending until field values are valid on unconfigured tenants", () => {
    expect(
      resolveTenantCostSettingsSaveSteps({
        isTenantConfigured: false,
        ratesValid: false,
        eaDiscountValid: false,
        saveComplete: false,
      }),
    ).toEqual([
      { id: "fields", label: "Enter architect rate and incident cost", complete: false },
      { id: "ea-discount", label: "Confirm EA discount percentage", complete: false },
      { id: "save", label: "Save cost settings", complete: false },
    ]);
  });

  it("marks save step complete after successful save", () => {
    expect(
      resolveTenantCostSettingsSaveSteps({
        isTenantConfigured: true,
        ratesValid: true,
        eaDiscountValid: true,
        saveComplete: true,
      }),
    ).toEqual([
      { id: "fields", label: "Enter architect rate and incident cost", complete: true },
      { id: "ea-discount", label: "Confirm EA discount percentage", complete: true },
      { id: "save", label: "Save cost settings", complete: true },
    ]);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveTenantCostSettingsSaveEmphasizedStepId({
        isTenantConfigured: false,
        ratesValid: false,
        eaDiscountValid: false,
        fieldsValid: false,
        saveComplete: false,
      }),
    ).toBe("fields");
  });
});
