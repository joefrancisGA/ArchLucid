import { describe, expect, it } from "vitest";

import {
  resolveRiskExceptionsRenewEmphasizedStepId,
  resolveRiskExceptionsRenewSteps,
} from "./risk-exceptions-renew-checklist";

describe("risk-exceptions-renew-checklist", () => {
  it("emphasizes expiring review when review is picked but expiring is not reviewed", () => {
    expect(
      resolveRiskExceptionsRenewEmphasizedStepId({
        reviewPicked: true,
        expiringReviewed: false,
        renewReady: false,
      }),
    ).toBe("expiring");
  });

  it("marks all steps complete when renewal is ready", () => {
    const steps = resolveRiskExceptionsRenewSteps({
      reviewPicked: true,
      expiringReviewed: true,
      renewReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveRiskExceptionsRenewEmphasizedStepId({
        reviewPicked: true,
        expiringReviewed: true,
        renewReady: true,
      }),
    ).toBe("renew");
  });
});
