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

/**
 * Historical workbook Notes for removed HEP (kept for owner note scripts / migration docs).
 * ASCII-only for Windows console note scripts.
 */
export const API_CONTRACTS_HELP_ALIAS_TRAFFIC_NOTE =
  "Honest api-contracts help alias (Help alias) - slug alias api-contracts -> governance-api-contracts (TB-1386); renders HelpApiContractsGuideView Evidence chrome (Sources strip + claim-discipline + PageContextualHelp + Category-1 on alias path). Canon HG = /help/governance-api-contracts. Body lives in API_CONTRACTS.md (TB-1388 contributor strip). Template HAP renamed to HEP to match owner. Sibling HG = canon topic. Score 58/100 (2026-08-08) - help-topic orientation hard-caps higher Evidence (alias inherits HG). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
