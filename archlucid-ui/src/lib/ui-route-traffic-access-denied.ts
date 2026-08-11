/**
 * Traffic workbook row ID for Access denied (/403).
 * Owner backlog shorthand: 4XX.
 */
export const ACCESS_DENIED_TRAFFIC_ROW_ID = "4XX";

/** Canonical path tracked on the 4XX workbook row. */
export const ACCESS_DENIED_TRAFFIC_PATH = "/403";

/** Workbook Section column value. */
export const ACCESS_DENIED_TRAFFIC_SECTION = "Auth";

/**
 * Owner workbook Notes for 4XX - documents Evidence chrome on Access denied.
 * ASCII-only for Windows console note scripts.
 */
export const ACCESS_DENIED_TRAFFIC_NOTE =
  "Access denied (Auth) - OperatorAccessDeniedPageClient with, role-missing messaging, sign-in/support actions. Not an operator PageContextualHelp surface. Sibling ASI = signin; AUB = bootstrap. Score 76/100 (2026-08-08) - authz gate hard-caps short of diligence packing. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
