import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SCIM_PROVISIONING_CANONICAL_PATH = "/administration/scim-provisioning" as const;

export const SCIM_PROVISIONING_HELP_TOPIC_LABEL = "How SCIM provisioning works" as const;

export const SCIM_PROVISIONING_FOLLOW_UPS_TITLE = "Where to go next";

export const SCIM_PROVISIONING_SOURCES_INTRO =
  "Use these follow-ups when token setup turns into SSO federation, role mapping, or assurance cites.";

/** Operator Sources - no self-href to SCIM provisioning. */
export const SCIM_PROVISIONING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "SSO wizard", href: "/administration/identity/sso-wizard" },
  { label: "Users", href: "/administration/users" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
