import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ROLE_MAPPING_SETTINGS_CANONICAL_PATH =
  "/administration/identity-providers/role-mapping" as const;

export const ROLE_MAPPING_SETTINGS_CLAIM_DISCIPLINE =
  "This Role mapping page configures how IdP groups or claims become ArchLucid app roles - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Users and roles help, SSO overview, or Assurance status when you need membership, federation, or trust cites.";

export const ROLE_MAPPING_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when claim mapping turns into membership invites, SSO setup, diagnostics, or assurance cites.";

export type RoleMappingSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to role-mapping. */
export const ROLE_MAPPING_SETTINGS_SOURCES: readonly RoleMappingSettingsSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
