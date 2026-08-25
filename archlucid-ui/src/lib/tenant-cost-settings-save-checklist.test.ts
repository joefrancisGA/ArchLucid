import { describe, expect, it } from "vitest";

import {
  resolveTenantCostSettingsSaveEmphasizedStepId,
  resolveTenantCostSettingsSaveSteps,
} from "@/lib/tenant-cost-settings-save-checklist";

describe("tenant-cost-settings-save-checklist", () => {
  it("marks save step complete after successful save", () => {
    expect(
      resolveTenantCostSettingsSaveSteps({
        fieldsValid: true,
        saveComplete: true,
      }),
    ).toEqual([
      { id: "fields", label: "Enter architect rate and incident cost", complete: true },
      { id: "ea-discount", label: "Confirm EA discount percentage", complete: true },
      { id: "save", label: "Save workspace cost settings", complete: true },
    ]);
  });

  it("emphasizes fields when validation fails", () => {
    expect(
      resolveTenantCostSettingsSaveEmphasizedStepId({
        fieldsValid: false,
        saveComplete: false,
      }),
    ).toBe("fields");
  });
});
