import { GOVERNANCE_POLICY_PACKS_PATH, governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";

import type {
  GovernanceSetupFoundationIndicator,
  GovernanceSetupStepDefinition,
  GovernanceSetupStepStatus,
} from "./governance-setup-guide-types";

export const GOVERNANCE_SETUP_GUIDE_STEPS: readonly GovernanceSetupStepDefinition[] = [
  {
    stepNumber: 1,
    title: "Set the policy baseline",
    description: "Choose the policy pack and enforcement thresholds used for architecture reviews.",
    primaryActionLabel: "Configure policy packs",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 2,
    title: "Validate threshold impact",
    description: "Run a dry-run to understand how proposed thresholds affect existing review findings.",
    primaryActionLabel: "Run threshold preview",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 3,
    title: "Configure alert ownership",
    description: "Route important governance alerts to the teams responsible for responding.",
    primaryActionLabel: "Configure alerts",
    primaryActionHref: governanceAlertRulesTabHref("routing"),
    secondaryActionLabel: "Check connector readiness",
    secondaryActionHref: INTEGRATIONS_READINESS_PATH,
  },
  {
    stepNumber: 4,
    title: "Define approval expectations",
    description: "Set the approval path, responsible roles, and expected response times.",
    primaryActionLabel: "Configure approvals",
    primaryActionHref: "/governance",
  },
  {
    stepNumber: 5,
    title: "Prepare governance reporting",
    description: "Confirm that sponsors can see posture, risk, drift, approvals, and value signals.",
    primaryActionLabel: "Open workspace overview",
    primaryActionHref: "/governance",
  },
] as const;

export const GOVERNANCE_SETUP_FOUNDATION_INDICATORS: readonly GovernanceSetupFoundationIndicator[] = [
  { id: "policy-baseline", label: "Policy baseline established", stepIndex: 0 },
  { id: "alert-ownership", label: "Alert ownership assigned", stepIndex: 2 },
  { id: "approval-expectations", label: "Approval expectations documented", stepIndex: 3 },
  { id: "sponsor-reporting", label: "Sponsor reporting available", stepIndex: 4 },
] as const;

export type GovernanceSetupProgressSummary = {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly progressFraction: number;
  readonly firstIncompleteIndex: number | null;
};

export function summarizeGovernanceSetupProgress(
  stepStatuses: readonly GovernanceSetupStepStatus[],
): GovernanceSetupProgressSummary {
  const totalCount = stepStatuses.length;
  const completedCount = stepStatuses.filter((status) => status === "complete").length;
  const firstIncompleteIndex = stepStatuses.findIndex((status) => status !== "complete");

  return {
    completedCount,
    totalCount,
    progressFraction: totalCount === 0 ? 0 : completedCount / totalCount,
    firstIncompleteIndex: firstIncompleteIndex < 0 ? null : firstIncompleteIndex,
  };
}

export function isGovernanceFoundationIndicatorComplete(
  indicator: GovernanceSetupFoundationIndicator,
  stepStatuses: readonly GovernanceSetupStepStatus[],
): boolean {
  return stepStatuses[indicator.stepIndex] === "complete";
}
