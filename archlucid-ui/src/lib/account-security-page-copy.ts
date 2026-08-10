/** Operator-facing copy for `/administration/account-security` (TB-1881). */

export const ACCOUNT_SECURITY_PAGE_TITLE = "Sign-in methods" as const;

export const ACCOUNT_SECURITY_PAGE_SUBTITLE =
  "View linked sign-in methods and add email one-time-code recovery while you are signed in. Email matches alone never link accounts." as const;

export const ACCOUNT_SECURITY_AUTH_GATE_MESSAGE =
  "Sign-in methods need a signed-in ArchLucid account. Sign in or start an evaluation to continue." as const;

export const ACCOUNT_SECURITY_SELF_SETTINGS_DESCRIPTION =
  "Linked sign-in methods and email one-time-code recovery for your platform account." as const;

/** Buyer chrome must not imply SSO management or a full fresh sign-in for in-session email linking. */
export const ACCOUNT_SECURITY_BANNED_PAGE_COPY = [
  "fresh sign-in",
  "fresh sign in",
  "Account security",
  " SSO",
  "sso ",
] as const;
