/** Legacy bookmark path — App Router shim forwards to canonical auth routes (TB-1791). */
export const LEGACY_LOGIN_PATH = "/login";

/** Canonical operator sign-in surface tracked on traffic row ASI. */
export const CANONICAL_AUTH_SIGNIN_PATH = "/auth/signin";

/** Idle-timeout handoff surface when legacy bookmarks include `reason=idle-timeout`. */
export const AUTH_SESSION_EXPIRED_PATH = "/auth/session-expired";
