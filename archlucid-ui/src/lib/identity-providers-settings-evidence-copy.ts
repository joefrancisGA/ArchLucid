import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const IDENTITY_PROVIDERS_SETTINGS_CANONICAL_PATH =
  "/administration/identity-providers" as const;

export const IDENTITY_PROVIDERS_SETTINGS_CLAIM_DISCIPLINE =
  "This SSO and identity hub configures federation and sign-in for the workspace - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Enterprise onboarding help, Users and roles, or Assurance status when you need onboarding, membership, or trust cites.";

export const IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when SSO setup turns into domain enforcement, role mapping, membership, or assurance cites.";

export type IdentityProvidersSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to the identity-providers hub. */
export const IDENTITY_PROVIDERS_SETTINGS_SOURCES: readonly IdentityProvidersSettingsSourceLink[] = [
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Sign-in domains", href: "/administration/auth-domains" },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
