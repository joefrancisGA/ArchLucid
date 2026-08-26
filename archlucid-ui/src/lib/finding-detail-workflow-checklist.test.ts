import { describe, expect, it } from "vitest";

import {
  resolveFindingDetailWorkflowEmphasizedStepId,
  resolveFindingDetailWorkflowSteps,
  resolveFindingDetailWorkflowTraceReadyFromPayload,
} from "./finding-detail-workflow-checklist";

describe("finding-detail-workflow-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveFindingDetailWorkflowEmphasizedStepId({
        reviewPicked: true,
        summaryLoaded: false,
        traceReady: false,
      }),
    ).toBe("summary");
  });

  it("marks trace ready when inspect payload has traceable evidence", () => {
    const steps = resolveFindingDetailWorkflowSteps({
      reviewPicked: true,
      summaryLoaded: true,
      traceReady: resolveFindingDetailWorkflowTraceReadyFromPayload({
        evidenceCount: 1,
        decisionRuleId: null,
        reasoningTrace: null,
      }),
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
