import { describe, expect, it } from "vitest";

import {
  resolveGraphInspectEmphasizedStepId,
  resolveGraphInspectSteps,
} from "./graph-inspect-checklist";

describe("graph-inspect-checklist", () => {
  it("emphasizes the first incomplete inspect step", () => {
    expect(
      resolveGraphInspectEmphasizedStepId({
        reviewPicked: true,
        graphLoaded: false,
        inspectComplete: false,
      }),
    ).toBe("load");
  });

  it("marks all steps complete when inspect is done", () => {
    const steps = resolveGraphInspectSteps({
      reviewPicked: true,
      graphLoaded: true,
      inspectComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(resolveGraphInspectEmphasizedStepId({
      reviewPicked: true,
      graphLoaded: true,
      inspectComplete: true,
    })).toBe("inspect");
  });
});
