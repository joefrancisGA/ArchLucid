import { describe, expect, it } from "vitest";

import {
  resolveFindingInspectCompleteFromPayload,
  resolveFindingInspectEmphasizedStepId,
  resolveFindingInspectSteps,
} from "./finding-inspect-checklist";

describe("finding-inspect-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveFindingInspectEmphasizedStepId({
        reviewPicked: true,
        evidenceLoaded: false,
        inspectComplete: false,
      }),
    ).toBe("load");
  });

  it("marks inspect complete when traceable evidence exists", () => {
    const steps = resolveFindingInspectSteps({
      reviewPicked: true,
      evidenceLoaded: true,
      inspectComplete: resolveFindingInspectCompleteFromPayload({
        evidenceCount: 1,
        decisionRuleId: null,
        reasoningTrace: null,
      }),
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
