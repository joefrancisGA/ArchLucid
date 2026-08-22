import { ALERTS_CONFIGURE_RULES_LINK_LABEL } from "@/lib/alerts-page-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF, GOVERNANCE_POLICY_PACKS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK } from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

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
    tracked: true,
    primaryActionLabel: "Configure policy packs",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 2,
    title: "Validate threshold impact",
    description: "Run a dry-run to understand how proposed thresholds affect existing review findings.",
    outcome: "You see finding impact before thresholds go live.",
    tracked: false,
    primaryActionLabel: "Run threshold preview",
    primaryActionHref: GOVERNANCE_POLICY_PACKS_PATH,
  },
  {
    stepNumber: 3,
    title: "Configure alert ownership",
    description: "Route important alerts to the teams responsible for responding.",
    outcome: "Critical signals reach owners instead of a silent inbox.",
    tracked: true,
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
    tracked: false,
    primaryActionLabel: "Configure approvals",
    primaryActionHref: "/governance/approval-queue",
  },
  {
    stepNumber: 5,
    title: "Prepare approval reporting",
    description: "Confirm that sponsors can see posture, risk, drift, approvals, and value signals.",
    outcome: "Sponsors can brief from workspace health without assembling slides.",
    tracked: false,
    primaryActionLabel: `Open ${TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label.toLowerCase()}`,
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
  /** Count of workspace-tracked steps only — not all guide steps. */
  readonly totalCount: number;
  readonly untrackedCount: number;
  readonly progressFraction: number;
  /**
   * Index into the full {@link GOVERNANCE_SETUP_GUIDE_STEPS} list for the first incomplete
   * tracked step — never an untracked step index so recommendation cannot pin to undetectable work.
   */
  readonly firstIncompleteIndex: number | null;
  readonly nextStepTitle: string | null;
  readonly isComplete: boolean;
};

export function summarizeGovernanceSetupProgress(
  stepStatuses: readonly GovernanceSetupStepStatus[],
  steps: readonly GovernanceSetupStepDefinition[] = GOVERNANCE_SETUP_GUIDE_STEPS,
): GovernanceSetupProgressSummary {
  const trackedStepIndices = steps
    .map((step, index) => (step.tracked ? index : -1))
    .filter((index) => index >= 0);
  const trackedTotalCount = trackedStepIndices.length;
  const untrackedCount = steps.length - trackedTotalCount;

  let completedCount = 0;

  for (const index of trackedStepIndices) {
    if (stepStatuses[index] === "complete") {
      completedCount += 1;
    }
  }

  const firstIncompleteTrackedIndex = trackedStepIndices.find(
    (index) => stepStatuses[index] !== "complete",
  );
  const firstIncompleteIndex = firstIncompleteTrackedIndex ?? null;
  const nextStepTitle =
    firstIncompleteIndex === null ? null : (steps[firstIncompleteIndex]?.title ?? null);

  return {
    completedCount,
    totalCount: trackedTotalCount,
    untrackedCount,
    progressFraction: trackedTotalCount === 0 ? 0 : completedCount / trackedTotalCount,
    firstIncompleteIndex,
    nextStepTitle,
    isComplete: trackedTotalCount > 0 && completedCount === trackedTotalCount,
  };
}

export function isGovernanceFoundationIndicatorComplete(
  indicator: GovernanceSetupFoundationIndicator,
  stepStatuses: readonly GovernanceSetupStepStatus[],
): boolean {
  return stepStatuses[indicator.stepIndex] === "complete";
}
