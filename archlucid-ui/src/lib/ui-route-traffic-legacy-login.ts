import { LEGACY_LOGIN_PATH } from "@/lib/legacy-login-route";

/**
 * Traffic workbook row ID for the legacy `/login` redirect shim.
 * Owner backlog shorthand: LOX.
 */
export const LEGACY_LOGIN_TRAFFIC_ROW_ID = "LOG";

/** Canonical path tracked on the LOG workbook row. */
export const LEGACY_LOGIN_TRAFFIC_PATH = LEGACY_LOGIN_PATH;

/**
 * Owner workbook Notes for LOG — documents that the shim forwards to `/auth/signin`
 * and routes idle-timeout bookmarks to `/auth/session-expired`.
 */
export const LEGACY_LOGIN_TRAFFIC_NOTE =
  "Legacy sign-in bookmark — App Router shim redirects to /auth/signin (query preserved); reason=idle-timeout → /auth/session-expired (TB-1791). Canonical UX on ASI.";
