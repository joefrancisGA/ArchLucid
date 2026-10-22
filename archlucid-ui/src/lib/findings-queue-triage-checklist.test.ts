import { describe, expect, it } from "vitest";

import {
  resolveFindingsQueueTriageEmphasizedStepId,
  resolveFindingsQueueTriageSteps,
} from "./findings-queue-triage-checklist";

describe("findings-queue-triage-checklist", () => {
  it("emphasizes the first incomplete triage step", () => {
    expect(
      resolveFindingsQueueTriageEmphasizedStepId({
        reviewPicked: true,
        findingOpened: false,
        dispositionRecorded: false,
      }),
    ).toBe("open");
  });

  it("marks all steps complete when disposition is recorded", () => {
    const steps = resolveFindingsQueueTriageSteps({
      reviewPicked: true,
      findingOpened: true,
      dispositionRecorded: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
