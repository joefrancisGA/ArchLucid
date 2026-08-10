import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

export type OperatorBillingPlanKind =
  | "demo-workspace"
  | "frictionless-trial"
  | "tenant-trial"
  | "paid-plan"
  | "no-paid-plan"
  | "unknown";

export type OperatorBillingSubscriptionLoadState = "pending" | "unavailable" | "resolved";

export type OperatorBillingCurrentPlanView = {
  planKind: OperatorBillingPlanKind;
  headline: string;
  supportingLine: string;
  workspaceLabel: string | null;
  aiBudgetRemainingPercent: number | null;
  hasPaidPlan: boolean;
};

type ResolveOperatorBillingCurrentPlanInput = {
  isDemoMode: boolean;
  isFrictionlessTrial: boolean;
  trialStatus: TenantTrialStatusPayload["status"] | null | undefined;
  trialDaysRemaining: number | null | undefined;
  workspaceLabel: string | null;
  aiBudgetRemainingPercent: number | null;
  /** From `GET /v1/tenant/usage-status` — when false with a commercial tier, treat as paid. */
  isTrialUsage?: boolean | null;
  commercialTier?: string | null;
  subscriptionLoadState?: OperatorBillingSubscriptionLoadState;
};

function isActiveTenantTrialStatus(status: TenantTrialStatusPayload["status"] | null | undefined): boolean {
  return status === "Active" || status === "ReadOnly" || status === "ExportOnly";
}

export function resolveOperatorBillingCurrentPlan(
  input: ResolveOperatorBillingCurrentPlanInput,
): OperatorBillingCurrentPlanView {
  if (input.subscriptionLoadState === "pending") {
    return {
      planKind: "unknown",
      headline: "Checking…",
      supportingLine: "Loading subscription details for this workspace.",
      workspaceLabel: null,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: false,
    };
  }

  if (input.subscriptionLoadState === "unavailable") {
    return {
      planKind: "unknown",
      headline: "Unavailable",
      supportingLine: "Subscription status unavailable — open Billing and plans.",
      workspaceLabel: null,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: false,
    };
  }

  const workspaceSuffix =
    input.workspaceLabel !== null && input.workspaceLabel.trim().length > 0
      ? input.workspaceLabel.trim()
      : null;

  if (input.isDemoMode) {
    return {
      planKind: "demo-workspace",
      headline: "Demo workspace",
      supportingLine:
        workspaceSuffix !== null
          ? `${workspaceSuffix} is using the demo workspace. No paid plan is active.`
          : "This workspace is using the demo workspace. No paid plan is active.",
      workspaceLabel: workspaceSuffix,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: false,
    };
  }

  if (input.isFrictionlessTrial) {
    return {
      planKind: "frictionless-trial",
      headline: "Frictionless trial",
      supportingLine: "You are exploring sample data without a paid plan. Choose a plan to continue in production.",
      workspaceLabel: workspaceSuffix,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: false,
    };
  }

  if (isActiveTenantTrialStatus(input.trialStatus)) {
    const daysLine =
      typeof input.trialDaysRemaining === "number" && input.trialDaysRemaining >= 0
        ? `${input.trialDaysRemaining} day${input.trialDaysRemaining === 1 ? "" : "s"} remaining in trial.`
        : "Trial is active. No paid plan is selected yet.";

    return {
      planKind: "tenant-trial",
      headline: "Trial",
      supportingLine: daysLine,
      workspaceLabel: workspaceSuffix,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: false,
    };
  }

  const commercialTier =
    typeof input.commercialTier === "string" ? input.commercialTier.trim() : "";

  if (input.isTrialUsage === false && commercialTier.length > 0) {
    return {
      planKind: "paid-plan",
      headline: commercialTier,
      supportingLine:
        workspaceSuffix !== null
          ? `${workspaceSuffix} is on the ${commercialTier} plan. Manage seats, invoices, and payment from Billing and plans.`
          : `This workspace is on the ${commercialTier} plan. Manage seats, invoices, and payment from Billing and plans.`,
      workspaceLabel: workspaceSuffix,
      aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
      hasPaidPlan: true,
    };
  }

  return {
    planKind: "no-paid-plan",
    headline: "No paid plan",
    supportingLine:
      workspaceSuffix !== null
        ? `${workspaceSuffix} does not have an active paid plan. Compare plans on public pricing or open Billing and plans to subscribe.`
        : "No paid plan is active. Compare plans on public pricing or open Billing and plans to subscribe.",
    workspaceLabel: workspaceSuffix,
    aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
    hasPaidPlan: false,
  };
}
