import { GOVERNANCE_API_CONTRACTS_HELP_PATH } from "@/lib/governance-api-contracts-help-route";

/**
 * Traffic workbook row ID for Governance and API contracts help.
 * Owner backlog shorthand: HG.
 */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_ROW_ID = "HG";

/** Canonical path tracked on the HG workbook row. */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH = GOVERNANCE_API_CONTRACTS_HELP_PATH;

/** Workbook Section column value — in-app help, not marketing. */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HG — documents the Admin-gated API contracts reference.
 */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_NOTE =
  "Admin-gated internal-runbook (TB-1384) — HelpTopicAuthorityGate + HelpTopicMarkdownView with contributor-section strip (TB-1388). API_CONTRACTS.md technical reference; not buyer governance help. Help center internal tier; not featured. Buyer Findings/Governance guides link to audit-trail instead (TB-1387). Not a specialty guide.";
