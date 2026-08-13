import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_DOMAINS_SETTINGS_CANONICAL_PATH = "/administration/auth-domains" as const;

export const AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL = "How sign-in domains work" as const;

export const AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE =
  "This Sign-in domains page verifies email domain ownership and SSO enforcement readiness — it is not a signed-review diligence Sources package. Open SSO and identity, Users and roles help, or Assurance status when you need federation setup, membership, or trust cites.";

export const AUTH_DOMAINS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when domain verification turns into identity-provider setup, recovery admins, or assurance cites.";


/** Operator Sources - no self-href to `/administration/auth-domains`. */
export const AUTH_DOMAINS_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Sign-in methods", href: "/administration/account-security" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
