import { describe, expect, it } from "vitest";

import {
  resolveDecisionRegisterFilterEmphasizedStepId,
  resolveDecisionRegisterFilterSteps,
} from "./decision-register-filter-checklist";

describe("decision-register-filter-checklist", () => {
  it("emphasizes filters when review is picked but filters are not configured", () => {
    expect(
      resolveDecisionRegisterFilterEmphasizedStepId({
        reviewPicked: true,
        filtersConfigured: false,
        registerReviewed: false,
      }),
    ).toBe("filters");
  });

  it("marks all steps complete when register is reviewed", () => {
    const steps = resolveDecisionRegisterFilterSteps({
      reviewPicked: true,
      filtersConfigured: true,
      registerReviewed: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveDecisionRegisterFilterEmphasizedStepId({
        reviewPicked: true,
        filtersConfigured: true,
        registerReviewed: true,
      }),
    ).toBe("register");
  });
});
