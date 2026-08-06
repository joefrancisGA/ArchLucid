import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH =
  "/administration/identity-providers/diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CLAIM_DISCIPLINE =
  "This Identity diagnostics page validates federation health probes and support tooling - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO =
  "Use these follow-ups when diagnostic probes turn into SSO setup, role mapping, or assurance cites.";

export type IdentityProvidersDiagnosticsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to identity diagnostics. */
export const IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES: readonly IdentityProvidersDiagnosticsSourceLink[] =
  [
    { label: "SSO and identity", href: "/administration/identity-providers" },
    { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
    { label: "OIDC/JWT", href: "/administration/identity-providers/oidc" },
    { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
    { label: "Assurance status", href: "/security-trust" },
  ] as const;
