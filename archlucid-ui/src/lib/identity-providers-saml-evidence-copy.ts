import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const IDENTITY_PROVIDERS_SAML_CANONICAL_PATH =
  "/administration/identity-providers/saml" as const;

export const IDENTITY_PROVIDERS_SAML_CLAIM_DISCIPLINE =
  "This SAML page configures SP metadata, signing, and claim mapping for workspace federation - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const IDENTITY_PROVIDERS_SAML_SOURCES_INTRO =
  "Use these follow-ups when SAML SP configuration turns into SSO wizard steps, role mapping, diagnostics, or assurance cites.";

export type IdentityProvidersSamlSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to SAML settings. */
export const IDENTITY_PROVIDERS_SAML_SOURCES: readonly IdentityProvidersSamlSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
