import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ROLE_MAPPING_SETTINGS_CANONICAL_PATH =
  "/administration/identity-providers/role-mapping" as const;

export const ROLE_MAPPING_SETTINGS_HELP_TOPIC_LABEL = "How role mapping works" as const;

export const ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE =
  "This Role mapping page configures how IdP groups or claims become ArchLucid app roles - it is not a signed-review diligence Sources package. Open Users and roles help, SSO overview, or Assurance status when you need membership, federation, or trust cites.";

export const ROLE_MAPPING_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when claim mapping turns into membership invites, SSO setup, diagnostics, or assurance cites.";


/** Operator Sources - no self-href to role-mapping. */
export const ROLE_MAPPING_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
