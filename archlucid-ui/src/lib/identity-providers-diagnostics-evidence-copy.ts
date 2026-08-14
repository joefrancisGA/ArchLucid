import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH =
  "/administration/identity-providers/diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL = "How identity diagnostics work" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE = "Where to go next";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CLAIM_HEADING_ID =
  "identity-providers-diagnostics-settings-claim-discipline-heading" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CLAIM_DISCIPLINE =
  "This Identity diagnostics page validates federation health probes and support tooling - it is not a sealed-review diligence Sources package. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO =
  "Use these follow-ups when diagnostic probes turn into SSO setup, role mapping, or assurance cites.";


/** Operator Sources - no self-href to identity diagnostics. */
export const IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES: readonly EvidenceSourceLink[] =
  [
    { label: "SSO and identity", href: "/administration/identity-providers" },
    { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
    { label: "OIDC/JWT", href: "/administration/identity-providers/oidc" },
    { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
    { label: "Assurance status", href: "/security-trust" },
  ] as const;
