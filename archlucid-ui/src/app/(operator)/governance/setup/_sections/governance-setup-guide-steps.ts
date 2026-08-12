import { ALERTS_CONFIGURE_RULES_LINK_LABEL } from "@/lib/alerts-page-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF, GOVERNANCE_POLICY_PACKS_PATH, governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
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
    outcome: "Reviews evaluate against a shared baseline instead of ad-hoc judgment.",
    primaryActionLabel: "Configure policy packs",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 2,
    title: "Validate threshold impact",
    description: "Run a dry-run to understand how proposed thresholds affect existing review findings.",
    outcome: "You see finding impact before thresholds go live.",
    primaryActionLabel: "Run threshold preview",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 3,
    title: "Configure alert ownership",
    description: "Route important governance alerts to the teams responsible for responding.",
    outcome: "Critical signals reach owners instead of a silent inbox.",
    primaryActionLabel: ALERTS_CONFIGURE_RULES_LINK_LABEL,
    primaryActionHref: governanceAlertRulesTabHref("notifications"),
    secondaryActionLabel: "Check connector readiness",
    secondaryActionHref: INTEGRATIONS_READINESS_PATH,
  },
  {
    stepNumber: 4,
    title: "Define approval expectations",
    description: "Set the approval path, responsible roles, and expected response times.",
    outcome: "Approvals have clear owners and response expectations.",
    primaryActionLabel: "Configure approvals",
    primaryActionHref: "/governance/approval-queue",
  },
  {
    stepNumber: 5,
    title: "Prepare governance reporting",
    description: "Confirm that sponsors can see posture, risk, drift, approvals, and value signals.",
    outcome: "Sponsors can brief from workspace health without assembling slides.",
    primaryActionLabel: "Open workspace overview",
    primaryActionHref: GOVERNANCE_WORKSPACE_HEALTH_HREF,
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
  readonly nextStepTitle: string | null;
  readonly isComplete: boolean;
};

export function summarizeGovernanceSetupProgress(
  stepStatuses: readonly GovernanceSetupStepStatus[],
  steps: readonly GovernanceSetupStepDefinition[] = GOVERNANCE_SETUP_GUIDE_STEPS,
): GovernanceSetupProgressSummary {
  const totalCount = stepStatuses.length;
  const completedCount = stepStatuses.filter((status) => status === "complete").length;
  const firstIncompleteIndex = stepStatuses.findIndex((status) => status !== "complete");
  const nextStepTitle =
    firstIncompleteIndex < 0 ? null : (steps[firstIncompleteIndex]?.title ?? null);

  return {
    completedCount,
    totalCount,
    progressFraction: totalCount === 0 ? 0 : completedCount / totalCount,
    firstIncompleteIndex: firstIncompleteIndex < 0 ? null : firstIncompleteIndex,
    nextStepTitle,
    isComplete: totalCount > 0 && completedCount === totalCount,
  };
}

export function isGovernanceFoundationIndicatorComplete(
  indicator: GovernanceSetupFoundationIndicator,
  stepStatuses: readonly GovernanceSetupStepStatus[],
): boolean {
  return stepStatuses[indicator.stepIndex] === "complete";
}
