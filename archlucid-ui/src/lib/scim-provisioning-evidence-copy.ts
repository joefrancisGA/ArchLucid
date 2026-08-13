import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SCIM_PROVISIONING_CANONICAL_PATH = "/administration/scim-provisioning" as const;

export const SCIM_PROVISIONING_HELP_TOPIC_LABEL = "How SCIM provisioning works" as const;

export const SCIM_PROVISIONING_CLAIM_DISCIPLINE =
  "This SCIM provisioning page manages inbound directory tokens for workspace user sync - it is not a signed-review diligence Sources package. Open SSO and identity, SSO wizard, or Assurance status when you need federation setup or trust cites.";

export const SCIM_PROVISIONING_SOURCES_INTRO =
  "Use these follow-ups when token setup turns into SSO federation, role mapping, or assurance cites.";


/** Operator Sources - no self-href to SCIM provisioning. */
export const SCIM_PROVISIONING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "SSO wizard", href: "/administration/identity/sso-wizard" },
  { label: "Users", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
