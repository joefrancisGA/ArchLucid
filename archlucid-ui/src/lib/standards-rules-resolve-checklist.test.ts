import { describe, expect, it } from "vitest";

import {
  resolveStandardsRulesResolveEmphasizedStepId,
  resolveStandardsRulesResolveSteps,
} from "./standards-rules-resolve-checklist";

describe("standards-rules-resolve-checklist", () => {
  it("emphasizes filters when review is picked but rules are not filtered", () => {
    expect(
      resolveStandardsRulesResolveEmphasizedStepId({
        reviewPicked: true,
        rulesFiltered: false,
        resolveReady: false,
      }),
    ).toBe("filters");
  });

  it("marks all steps complete when resolution is ready", () => {
    const steps = resolveStandardsRulesResolveSteps({
      reviewPicked: true,
      rulesFiltered: true,
      resolveReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveStandardsRulesResolveEmphasizedStepId({
        reviewPicked: true,
        rulesFiltered: true,
        resolveReady: true,
      }),
    ).toBe("resolve");
  });
});
