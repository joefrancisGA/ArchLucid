import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH =
  "/administration/identity-providers" as const;

export const IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL = "How SSO and identity work" as const;

export const IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const IDENTITY_PROVIDERS_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const IDENTITY_PROVIDERS_SETTINGS_CLAIM_HEADING_ID =
  "identity-providers-settings-claim-discipline-heading" as const;

export const IDENTITY_PROVIDERS_SETTINGS_CLAIM_DISCIPLINE =
  "This SSO and identity hub configures organization sign-in — access configuration only, not a full audit export. Open Audit trail or Assurance status when you need sealed-record evidence.";

export const IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when SSO setup turns into domain enforcement, role mapping, membership, or official assurance materials.";

/** Operator Sources - no self-href to the identity-providers hub. */
export const IDENTITY_PROVIDERS_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Sign-in domains", href: "/administration/auth-domains" },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
