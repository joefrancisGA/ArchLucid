import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUTH_DOMAINS_SETTINGS_CANONICAL_PATH = "/administration/auth-domains" as const;

export const AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL = "How sign-in domains work" as const;

export const AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const AUTH_DOMAINS_SETTINGS_CLAIM_HEADING_ID = "auth-domains-settings-claim-discipline-heading" as const;

export const AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE =
  "This Sign-in domains page verifies email domain ownership and SSO enforcement readiness — not a full audit export. Open SSO and identity, Users and roles help, or Assurance status when you need federation setup or membership.";

export const AUTH_DOMAINS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when domain verification turns into identity-provider setup, recovery admins, or official assurance materials.";


/** Operator Sources - no self-href to `/administration/auth-domains`. */
export const AUTH_DOMAINS_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Sign-in methods", href: ACCOUNT_SECURITY_PATH },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
