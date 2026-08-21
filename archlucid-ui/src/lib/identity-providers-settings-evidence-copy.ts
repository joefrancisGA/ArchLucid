import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH =
  "/administration/identity-providers" as const;

export const IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL = "How SSO and identity work" as const;

export const IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

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
