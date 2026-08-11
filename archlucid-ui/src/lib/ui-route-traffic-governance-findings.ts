import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance-route-paths";

/**
 * Traffic workbook row ID for Governance findings queue.
 * Owner backlog shorthand: GFN.
 */
export const GOVERNANCE_FINDINGS_TRAFFIC_ROW_ID = "GFN";

/** Canonical path tracked on the GFN workbook row. */
export const GOVERNANCE_FINDINGS_TRAFFIC_PATH = GOVERNANCE_FINDINGS_PATH;

/** Workbook Section column value. */
export const GOVERNANCE_FINDINGS_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for GFN - documents Evidence chrome on Findings queue.
 * ASCII-only for Windows console note scripts.
 */
export const GOVERNANCE_FINDINGS_TRAFFIC_NOTE =
  "Findings queue (Alerts/gov) - GovernanceFindingsQueueClient with PageContextualHelpButton (topic map governance-approval; Category-1 registry), filters/list. Sibling RRF = finding detail; ERU = evidence-trace; AL = alerts. Not a signed-record Sources trail by itself. Score 72/100 (2026-08-08) - risk-register queue hard-caps higher Evidence without full diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
