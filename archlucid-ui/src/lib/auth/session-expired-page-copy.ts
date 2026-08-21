/** Public marketing welcome — safe anonymous exit when declining Sign in (TB-1315). */
export const SESSION_EXPIRED_SECONDARY_EXIT_PATH = "/welcome" as const;

export const SESSION_EXPIRED_SECONDARY_EXIT_LABEL = "Back to ArchLucid";

/** TB-1313: branded document title for `/auth/session-expired`. */
export const SESSION_EXPIRED_PAGE_METADATA_TITLE = "Session expired · ArchLucid";

export const SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION =
  "Your ArchLucid session ended. Sign in again to continue, or return to the public welcome page.";

/** TB-1314: Suspense fallback copy while search params hydrate. */
export const SESSION_EXPIRED_LOADING_DETAIL = "Preparing session recovery…";

export const SESSION_EXPIRED_PAGE_TITLE = "Session expired" as const;

export const SESSION_EXPIRED_PRIMARY_CONTENT_ID = "session-expired-primary-content" as const;

export const SESSION_EXPIRED_SKIP_LINK_LABEL = "Skip to session recovery content" as const;

export const SESSION_EXPIRED_PASSWORDLESS_EXPLANATION =
  "ArchLucid does not use a product password. Sign in with a work or school account or a one-time email code.";

export const SESSION_EXPIRED_SIGN_OUT_DISCLOSURE_LABEL = "When you were signed out";

/** Framed for idle-timeout recovery when OIDC cannot start — not "Access request" (TB-1316). */
export const SESSION_EXPIRED_SIGN_IN_ERROR_TITLE = "Sign-in could not start";
