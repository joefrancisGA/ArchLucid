import { describe, expect, it } from "vitest";

import { resolveOperatorBillingCurrentPlan } from "@/lib/operator/operator-billing-current-plan";

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
    expect(view.supportingLine).not.toContain("below");
    expect(view.hasPaidPlan).toBe(false);
  });

  it("returns paid plan when usage reports a commercial tier off trial", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "None",
      trialDaysRemaining: null,
      workspaceLabel: "Acme",
      aiBudgetRemainingPercent: 40,
      isTrialUsage: false,
      commercialTier: "Team",
    });

    expect(view.planKind).toBe("paid-plan");
    expect(view.headline).toBe("Team");
    expect(view.hasPaidPlan).toBe(true);
    expect(view.supportingLine).toContain("Team");
    expect(view.supportingLine).toContain("Acme");
  });

  it("returns unknown copy while subscription data is pending", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "None",
      trialDaysRemaining: null,
      workspaceLabel: null,
      aiBudgetRemainingPercent: null,
      subscriptionLoadState: "pending",
    });

    expect(view.planKind).toBe("unknown");
    expect(view.headline).toBe("Checking…");
    expect(view.hasPaidPlan).toBe(false);
  });

  it("returns paid plan when isTrialUsage is false despite stale Active trial status", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "Active",
      trialDaysRemaining: 12,
      workspaceLabel: "Acme",
      aiBudgetRemainingPercent: 40,
      isTrialUsage: false,
      commercialTier: "Team",
      subscriptionLoadState: "resolved",
    });

    expect(view.planKind).toBe("paid-plan");
    expect(view.headline).toBe("Team");
    expect(view.hasPaidPlan).toBe(true);
    expect(view.supportingLine).toContain("Team");
    expect(view.supportingLine).not.toContain("Trial");
  });

  it("returns unavailable copy when subscription data cannot be loaded", () => {
    const view = resolveOperatorBillingCurrentPlan({
      isDemoMode: false,
      isFrictionlessTrial: false,
      trialStatus: "None",
      trialDaysRemaining: null,
      workspaceLabel: null,
      aiBudgetRemainingPercent: null,
      subscriptionLoadState: "unavailable",
    });

    expect(view.planKind).toBe("unknown");
    expect(view.supportingLine).toContain("Subscription status unavailable");
    expect(view.hasPaidPlan).toBe(false);
  });
});
