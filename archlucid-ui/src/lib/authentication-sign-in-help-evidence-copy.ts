import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTHENTICATION_SIGN_IN_HELP_CANONICAL_PATH = "/help/authentication-sign-in" as const;

export const AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE =
  "This Authentication and sign-in guide orients architects on how people sign in and how identity connects to workspace access — it is help orientation, not a signed-review diligence Sources package from your tenant. Open Users and roles, Security and trust help, or Configuration reference when you need live access or SSO setup.";

export const AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO =
  "Use these follow-ups when sign-in vocabulary turns into roles, account security, enterprise onboarding, or identity provider setup.";


/** Operator Sources — no self-href to `/help/authentication-sign-in`. */
export const AUTHENTICATION_SIGN_IN_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Enterprise onboarding", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "Sign in", href: "/auth/signin" },
] as const;
