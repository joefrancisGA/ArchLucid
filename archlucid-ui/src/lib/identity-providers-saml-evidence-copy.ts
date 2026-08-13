import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_SAML_CANONICAL_PATH =
  "/administration/identity-providers/saml" as const;

export const IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL = "How SAML federation works" as const;

export const IDENTITY_PROVIDERS_SAML_CLAIM_DISCIPLINE =
  "This SAML page configures IdP metadata lookup, issuer, role claim, and group-to-role mapping for organization-wide federation — plus read-only SP certificate health when SAML is enabled. It is not a signed-review diligence Sources package. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const IDENTITY_PROVIDERS_SAML_SOURCES_INTRO =
  "Use these follow-ups when SAML SP configuration turns into SSO wizard steps, role mapping, diagnostics, or assurance cites.";


/** Operator Sources - no self-href to SAML settings. */
export const IDENTITY_PROVIDERS_SAML_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
