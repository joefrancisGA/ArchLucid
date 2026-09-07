import { describe, expect, it } from "vitest";

import {
  resolveTenantCostSettingsSaveEmphasizedStepId,
  resolveTenantCostSettingsSaveSteps,
} from "@/lib/tenant-cost-settings-save-checklist";

describe("tenant-cost-settings-save-checklist", () => {
  it("leaves checklist steps pending until the operator touches fields", () => {
    expect(
      resolveTenantCostSettingsSaveSteps({
        ratesTouched: false,
        eaDiscountAcknowledged: false,
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
        ratesTouched: true,
        eaDiscountAcknowledged: true,
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
        ratesTouched: false,
        eaDiscountAcknowledged: false,
        fieldsValid: false,
        saveComplete: false,
      }),
    ).toBe("fields");
  });
});
