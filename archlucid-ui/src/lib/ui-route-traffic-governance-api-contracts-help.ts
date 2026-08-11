import { API_CONTRACTS_HELP_PATH } from "@/lib/api-contracts-help-route";

/**
 * Traffic workbook row ID for API contracts technical reference help.
 * Owner backlog shorthand: HG.
 */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_ROW_ID = "HG";

/** Canonical path tracked on the HG workbook row. */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH = API_CONTRACTS_HELP_PATH;

/** Workbook Section column value â€” in-app help, not marketing. */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HG â€” documents the specialty Admin API contracts surface.
 */
export const GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_NOTE =
  "Specialty Admin API contracts technical reference - HelpApiContractsGuideView with contract-facts landing, OpenAPI primary CTA, Sources strip, technical-reference navigation, and prepared API_CONTRACTS.md (TB-1388 contributor strip). Canonical slug api-contracts; legacy governance-api-contracts redirects here (TB-1386). Admin-gated internal-runbook (TB-1384); de-indexed from product search (TB-1385). Not bare HelpTopicMarkdownView. Score 60/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
