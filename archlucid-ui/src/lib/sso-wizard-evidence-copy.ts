import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SSO_WIZARD_CANONICAL_PATH = "/administration/identity/sso-wizard" as const;

export const SSO_WIZARD_HELP_TOPIC_LABEL = "How the SSO wizard works" as const;

export const SSO_WIZARD_CLAIM_DISCIPLINE =
  "This SSO wizard guides OIDC or SAML tenant activation - it is not a sealed-review diligence Sources package. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const SSO_WIZARD_SOURCES_INTRO =
  "Use these follow-ups when wizard steps turn into identity-provider hub setup, role mapping, diagnostics, or assurance cites.";


/** Operator Sources - no self-href to SSO wizard. */
export const SSO_WIZARD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "OIDC/JWT", href: "/administration/identity-providers/oidc" },
  { label: "SAML", href: "/administration/identity-providers/saml" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
] as const;
