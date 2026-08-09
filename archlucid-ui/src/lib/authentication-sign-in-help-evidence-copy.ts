import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH = "/help/authentication-sign-in" as const;

export const AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE =
  "This Authentication and sign-in guide orients architects on how people sign in and how identity connects to workspace access — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Users and roles, Account security, or Configuration reference when you need live access or SSO setup.";

export const AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO =
  "Use these follow-ups when sign-in vocabulary turns into roles, account security, enterprise onboarding, or identity provider setup.";

export type AuthenticationSignInHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/authentication-sign-in`. */
export const AUTHENTICATION_SIGN_IN_HELP_SOURCES: readonly AuthenticationSignInHelpSourceLink[] = [
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Account security", href: "/administration/account-security" },
  { label: "Enterprise onboarding", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "Sign in", href: "/auth/signin" },
] as const;
