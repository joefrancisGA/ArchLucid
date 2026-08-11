/** Public marketing welcome — safe anonymous exit when declining Sign in (TB-1315). */
export const SESSION_EXPIRED_SECONDARY_EXIT_PATH = "/welcome" as const;

export const SESSION_EXPIRED_SECONDARY_EXIT_LABEL = "Back to ArchLucid";

/** TB-1313: branded document title for `/auth/session-expired`. */
export const SESSION_EXPIRED_PAGE_METADATA_TITLE = "Session expired · ArchLucid";

export const SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION =
  "Your ArchLucid session ended. Sign in again to continue, or return to the public welcome page.";

/** Framed for idle-timeout recovery when OIDC cannot start — not "Access request" (TB-1316). */
export const SESSION_EXPIRED_SIGN_IN_ERROR_TITLE = "Sign-in could not start";
