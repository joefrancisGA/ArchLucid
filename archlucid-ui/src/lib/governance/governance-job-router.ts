/**

 * TB-2199 / TB-2230 - Approval queue / Findings queue / Decision register job router.

 * SoT for the upfront "which job am I doing?" chooser on governance homes.

 */



import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";

import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";

import {

  GOVERNANCE_APPROVAL_QUEUE_PATH,

  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,

} from "@/lib/governance/governance-route-paths";



export type GovernanceJobId =

  | "approve-governance"

  | "triage-findings"

  | "assigned-to-me-findings"

  | "record-decisions";



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

    "Use the Approval queue to submit reviews for governance approval and record authorized decisions.",

  href: GOVERNANCE_APPROVAL_QUEUE_PATH,

};



export const GOVERNANCE_JOB_TRIAGE_FINDINGS: GovernanceJobRouterOption = {

  id: "triage-findings",

  label: "Triage findings",

  whenToUse:

    "Use the findings queue to disposition risks, assign owners, and clear open governance items.",

  href: GOVERNANCE_FINDINGS_CANONICAL_PATH,

};



export const GOVERNANCE_JOB_ASSIGNED_TO_ME_FINDINGS: GovernanceJobRouterOption = {

  id: "assigned-to-me-findings",

  label: "Assigned to me",

  whenToUse:

    "Use your personal queue to remediate findings assigned to you across reviews in this workspace.",

  href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,

};



export const GOVERNANCE_JOB_RECORD_DECISIONS: GovernanceJobRouterOption = {

  id: "record-decisions",

  label: "Record decisions",

  whenToUse:

    "Use the Decision register to browse architecture decisions locked with sealed review records.",

  href: DECISION_REGISTER_CANONICAL_PATH,

};



/** Ordered chooser options (Approval queue, findings triage, assigned-to-me, then Decision register). */

export function buildGovernanceJobRouterOptions(): readonly GovernanceJobRouterOption[] {

  return [

    GOVERNANCE_JOB_APPROVE_GOVERNANCE,

    GOVERNANCE_JOB_TRIAGE_FINDINGS,

    GOVERNANCE_JOB_ASSIGNED_TO_ME_FINDINGS,

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

