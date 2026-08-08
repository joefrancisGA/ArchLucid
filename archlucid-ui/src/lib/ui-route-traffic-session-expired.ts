/**
 * Traffic workbook row ID for session-expired auth handoff.
 * Owner backlog shorthand: ASU.
 */
export const SESSION_EXPIRED_TRAFFIC_ROW_ID = "ASU";

/** Canonical path tracked on the ASU workbook row. */
export const SESSION_EXPIRED_TRAFFIC_PATH = "/auth/session-expired";

/** Workbook Section column value (template catalog). */
export const SESSION_EXPIRED_TRAFFIC_SECTION = "Auth";

/**
 * Owner workbook Notes for ASU — documents Evidence chrome on session-expired.
 */
export const SESSION_EXPIRED_TRAFFIC_NOTE =
  "Session expired (Auth) - SessionExpiredClient/SessionExpiredView with SessionExpiredEvidenceOrientationStrip (public Sources + claim-discipline: authentication handoff only). Not an operator PageContextualHelp surface (signed-out). Sibling ASI = /auth/signin; LOG = legacy /login. Score 40/100 (2026-08-05) — auth session-expired handoff hard-caps higher Evidence.";
