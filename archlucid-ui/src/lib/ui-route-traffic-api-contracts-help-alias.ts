import { GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-governance-api-contracts-help";

/**
 * Removed traffic workbook row ID for the retired `/help/api-contracts` alias (merged into HG).
 * Do not reintroduce — API contracts help is scored only on HG (`/help/governance-api-contracts`).
 */
export const REMOVED_API_CONTRACTS_HELP_ALIAS_TRAFFIC_ROW_ID = "HEP";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_API_CONTRACTS_HELP_ALIAS_TRAFFIC_PATH = "/help/api-contracts";

/** Canonical API contracts help scored on traffic row HG. */
export const CANONICAL_GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH =
  GOVERNANCE_API_CONTRACTS_HELP_TRAFFIC_PATH;
