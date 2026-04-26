import { describe, expect, it } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";

import { validateWizardStep } from "./wizard-step-validate";

describe("validateWizardStep", () => {
  it("returns errors for step 1 when systemName is empty", () => {
    const v = buildDefaultWizardValues();
    v.systemName = "";

    const err = validateWizardStep(1, v);
    expect(err.some((e) => e.field === "systemName")).toBe(true);
  });

  it("returns empty for step 1 when defaults are valid", () => {
    const v = buildDefaultWizardValues();
    expect(validateWizardStep(1, v)).toEqual([]);
  });

  it("returns errors for step 1 when systemName is one character", () => {
    const v = buildDefaultWizardValues();
    v.systemName = "a";

    const err = validateWizardStep(1, v);
    expect(err.some((e) => e.field === "systemName")).toBe(true);
  });

  it("returns errors for step 2 when description is under 10 characters", () => {
    const v = buildDefaultWizardValues();
    v.description = "short";

    const err = validateWizardStep(2, v);
    expect(err.some((e) => e.field === "description")).toBe(true);
  });
});
