import { describe, expect, it } from "vitest";

import { resolveOperatorBillingCurrentPlan } from "./operator-billing-current-plan";

describe("resolveOperatorBillingCurrentPlan", () => {
  it("returns demo workspace copy when demo mode is active", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: true,
      isFrictionlessTrial: false,
      trialStatus: "None",
      trialDaysRemaining: null,
      workspaceLabel: "Claims Intake Demo",
      aiBudgetRemainingPercent: 100,
    });

    expect(view.planKind).toBe("demo-workspace");
    expect(view.headline).toBe("Demo workspace");
    expect(view.supportingLine).toContain("Claims Intake Demo");
    expect(view.hasPaidPlan).toBe(false);
  });

  it("returns tenant trial copy with remaining days", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "Active",
      trialDaysRemaining: 12,
      workspaceLabel: "Pilot workspace",
      aiBudgetRemainingPercent: 64,
    });

    expect(view.planKind).toBe("tenant-trial");
    expect(view.headline).toBe("Trial");
    expect(view.supportingLine).toContain("12 days remaining");
  });

  it("returns no paid plan copy when no trial or demo applies", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "None",
      trialDaysRemaining: null,
      workspaceLabel: null,
      aiBudgetRemainingPercent: null,
    });

    expect(view.planKind).toBe("no-paid-plan");
    expect(view.supportingLine).toContain("No paid plan is active");
  });
});
