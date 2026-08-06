import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SSO_WIZARD_CANONICAL_PATH = "/administration/identity/sso-wizard" as const;

export const SSO_WIZARD_CLAIM_DISCIPLINE =
  "This SSO wizard guides OIDC or SAML tenant activation - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const SSO_WIZARD_SOURCES_INTRO =
  "Use these follow-ups when wizard steps turn into identity-provider hub setup, role mapping, diagnostics, or assurance cites.";

export type SsoWizardSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to SSO wizard. */
export const SSO_WIZARD_SOURCES: readonly SsoWizardSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "OIDC/JWT", href: "/administration/identity-providers/oidc" },
  { label: "SAML", href: "/administration/identity-providers/saml" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
] as const;
