import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_SAML_CANONICAL_PATH =
  "/administration/identity-providers/saml" as const;

export const IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL = "How SAML federation works" as const;

export const IDENTITY_PROVIDERS_SAML_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE = "Where to go next";

export const IDENTITY_PROVIDERS_SAML_CLAIM_HEADING_ID =
  "identity-providers-saml-settings-claim-discipline-heading" as const;

export const IDENTITY_PROVIDERS_SAML_CLAIM_DISCIPLINE =
  "This SAML page configures IdP metadata lookup, issuer, role claim, and group-to-role mapping for organization-wide federation — plus read-only SP certificate health when SAML is enabled. It is not a sealed-review diligence Sources package. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

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
