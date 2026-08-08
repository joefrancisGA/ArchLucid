import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";

/**
 * Traffic workbook row ID for governance approval queue.
 * Owner backlog shorthand: GOP.
 */
export const APPROVAL_QUEUE_TRAFFIC_ROW_ID = "GOP";

/** Canonical path tracked on the GOP workbook row. */
export const APPROVAL_QUEUE_TRAFFIC_PATH = GOVERNANCE_APPROVAL_QUEUE_PATH;

/** Workbook Section column value (owner catalog). */
export const APPROVAL_QUEUE_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for GOP - documents Evidence chrome on approval queue.
 * ASCII-only for Windows console note scripts.
 */
export const APPROVAL_QUEUE_TRAFFIC_NOTE =
  "Approval queue (Alerts/gov) - GovernanceWorkflowPageContent with PageContextualHelpButton (topic map governance-approval; Category-1 registry on /governance/approval-queue), ApprovalQueueEvidenceOrientationStrip (workspace Sources + claim-discipline), submit/approve/reject workflow + overview panel. Record-decision deep link (?runId=) keeps Approval queue page title aligned with nav, preselects the review picker, and resolves a human review title (not a raw GUID). Sibling GAI = approval lineage; GO = governance-approval help; GDX = workspace health; AUD = audit. Decision workflow - not a signed-record Sources trail alone. Does not imply CPA SOC 2 or third-party pen-test publication. Score 54/100 (2026-08-08) - deep-link review context + title honesty; approval-queue hub still hard-caps higher Evidence without audit export depth.";
