import { describe, expect, it } from "vitest";

import {
  resolveGovernanceWorkflowSubmitEmphasizedStepId,
  resolveGovernanceWorkflowSubmitSteps,
} from "@/lib/governance-workflow-submit-checklist";

describe("governance-workflow-submit-checklist", () => {
  it("marks steps complete in order", () => {
    expect(
      resolveGovernanceWorkflowSubmitSteps({
        reviewPicked: false,
        requiredFieldsComplete: false,
        submitComplete: false,
      }).map((step) => step.complete),
    ).toEqual([false, false, false]);

    expect(
      resolveGovernanceWorkflowSubmitSteps({
        reviewPicked: true,
        requiredFieldsComplete: true,
        submitComplete: true,
      }).map((step) => step.complete),
    ).toEqual([true, true, true]);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveGovernanceWorkflowSubmitEmphasizedStepId({
        reviewPicked: false,
        requiredFieldsComplete: false,
        submitComplete: false,
      }),
    ).toBe("review");

    expect(
      resolveGovernanceWorkflowSubmitEmphasizedStepId({
        reviewPicked: true,
        requiredFieldsComplete: false,
        submitComplete: false,
      }),
    ).toBe("fields");

    expect(
      resolveGovernanceWorkflowSubmitEmphasizedStepId({
        reviewPicked: true,
        requiredFieldsComplete: true,
        submitComplete: false,
      }),
    ).toBe("submit");
  });
});
