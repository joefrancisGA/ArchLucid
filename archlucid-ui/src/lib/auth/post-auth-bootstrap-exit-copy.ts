import {
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/session-expired-page-copy";

export { SESSION_EXPIRED_SECONDARY_EXIT_LABEL, SESSION_EXPIRED_SECONDARY_EXIT_PATH };

/** Safe re-auth entry — not operator `/` which may bounce back into bootstrap. */
export const POST_AUTH_BOOTSTRAP_SIGN_IN_PATH = "/auth/signin" as const;

export const POST_AUTH_BOOTSTRAP_SIGN_IN_AGAIN_LABEL = "Sign in again";

export const POST_AUTH_BOOTSTRAP_USE_DIFFERENT_ACCOUNT_LABEL = "Use a different account";

export const POST_AUTH_BOOTSTRAP_LOAD_ERROR_TITLE = "We could not continue setup";

export const POST_AUTH_BOOTSTRAP_LOAD_ERROR_MESSAGE =
  "We could not determine your next step. Try signing in again.";
