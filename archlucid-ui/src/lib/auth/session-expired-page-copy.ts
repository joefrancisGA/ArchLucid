/** Public marketing welcome — safe anonymous exit when declining Sign in (TB-1315). */
export const SESSION_EXPIRED_SECONDARY_EXIT_PATH = "/welcome" as const;

export const SESSION_EXPIRED_SECONDARY_EXIT_LABEL = "Back to ArchLucid";

/** Framed for idle-timeout recovery when OIDC cannot start — not "Access request" (TB-1316). */
export const SESSION_EXPIRED_SIGN_IN_ERROR_TITLE = "Sign-in could not start";
