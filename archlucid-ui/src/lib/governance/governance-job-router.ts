/**
 * TB-2199 / TB-2230 - Approval queue / Findings queue / Decision register job router.
 * SoT for the upfront "which job am I doing?" chooser on the three governance homes.
 */

import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

export type GovernanceJobId = "approve-governance" | "triage-findings" | "record-decisions";

export type GovernanceJobRouterOption = {
  readonly id: GovernanceJobId;
  readonly label: string;
  readonly whenToUse: string;
  readonly href: string;
};

export type GovernanceJobRouter = {
  readonly heading: string;
  readonly options: readonly GovernanceJobRouterOption[];
};

/** Chooser heading - steers operators before they open the wrong governance home. */
export const GOVERNANCE_JOB_ROUTER_HEADING = "Which job am I doing?" as const;

export const GOVERNANCE_JOB_APPROVE_GOVERNANCE: GovernanceJobRouterOption = {
  id: "approve-governance",
  label: "Approve governance",
  whenToUse:
    "Use the Approval queue to submit and approve governance packages for promotion.",
  href: GOVERNANCE_APPROVAL_QUEUE_PATH,
};

export const GOVERNANCE_JOB_TRIAGE_FINDINGS: GovernanceJobRouterOption = {
  id: "triage-findings",
  label: "Triage findings",
  whenToUse:
    "Use the findings queue to disposition risks, assign owners, and clear open governance items.",
  href: GOVERNANCE_FINDINGS_CANONICAL_PATH,
};

export const GOVERNANCE_JOB_RECORD_DECISIONS: GovernanceJobRouterOption = {
  id: "record-decisions",
  label: "Record decisions",
  whenToUse:
    "Use the Decision register to browse architecture decisions locked with signed review records.",
  href: DECISION_REGISTER_CANONICAL_PATH,
};

/** Ordered chooser options (Approval queue, findings triage, then Decision register). */
export function buildGovernanceJobRouterOptions(): readonly GovernanceJobRouterOption[] {
  return [
    GOVERNANCE_JOB_APPROVE_GOVERNANCE,
    GOVERNANCE_JOB_TRIAGE_FINDINGS,
    GOVERNANCE_JOB_RECORD_DECISIONS,
  ];
}

/** Full router structure for the strip (heading + options). */
export function getGovernanceJobRouter(): GovernanceJobRouter {
  return {
    heading: GOVERNANCE_JOB_ROUTER_HEADING,
    options: buildGovernanceJobRouterOptions(),
  };
}
