import { GOVERNANCE_APPROVAL_HELP_PATH } from "@/lib/governance-approval-help-route";

/**
 * Traffic workbook row ID for Governance approval help.
 * Owner backlog shorthand: GO.
 */
export const GOVERNANCE_APPROVAL_HELP_TRAFFIC_ROW_ID = "GO";

/** Canonical path tracked on the GO workbook row. */
export const GOVERNANCE_APPROVAL_HELP_TRAFFIC_PATH = GOVERNANCE_APPROVAL_HELP_PATH;

/** Workbook Section column value — in-app help topic, not marketing. */
export const GOVERNANCE_APPROVAL_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for GO — documents the specialty HelpGovernanceApprovalGuideView surface.
 */
export const GOVERNANCE_APPROVAL_HELP_TRAFFIC_NOTE =
  "Specialty governance approval guide — HelpGovernanceApprovalGuideView with workflow stepper, role guides, status table, decision outcomes, and collapsed HelpGovernanceApprovalTechnicalReference. Featured help-center product tier (pdfStatus customer). Primary CTAs to /governance, /governance/dashboard, and /governance/findings. Related docs link to audit-trail not API contracts (TB-1250 / TB-1387). Not bare HelpTopicMarkdownView.";
