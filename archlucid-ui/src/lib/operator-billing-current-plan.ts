import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

export type OperatorBillingPlanKind =
  | "demo-workspace"
  | "frictionless-trial"
  | "tenant-trial"
  | "no-paid-plan";

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
};

function isActiveTenantTrialStatus(status: TenantTrialStatusPayload["status"] | null | undefined): boolean {
  return status === "Active" || status === "ReadOnly" || status === "ExportOnly";
}

export function resolveOperatorBillingCurrentPlan(
  input: ResolveOperatorBillingCurrentPlanInput,
): OperatorBillingCurrentPlanView {
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

  return {
    planKind: "no-paid-plan",
    headline: "No paid plan",
    supportingLine:
      workspaceSuffix !== null
        ? `${workspaceSuffix} does not have an active paid plan. Choose a plan below.`
        : "No paid plan is active. Choose a plan below.",
    workspaceLabel: workspaceSuffix,
    aiBudgetRemainingPercent: input.aiBudgetRemainingPercent,
    hasPaidPlan: false,
  };
}
