import { CANONICAL_AUTH_SIGNIN_PATH, LEGACY_LOGIN_PATH } from "@/lib/legacy-login-route";

/**
 * Removed traffic workbook row ID for the retired `/login` bookmark.
 * Do not reintroduce — sign-in UX is scored only on ASI (`/auth/signin`).
 */
export const REMOVED_LEGACY_LOGIN_TRAFFIC_ROW_ID = "LOG";

/** Retired path — no live App Router page or next.config redirect. */
export const RETIRED_LEGACY_LOGIN_TRAFFIC_PATH = LEGACY_LOGIN_PATH;

/** Canonical operator sign-in scored on traffic row ASI. */
export const CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH = CANONICAL_AUTH_SIGNIN_PATH;
