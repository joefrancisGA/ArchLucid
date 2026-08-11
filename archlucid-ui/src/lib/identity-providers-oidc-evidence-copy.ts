import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH =
  "/administration/identity-providers/oidc" as const;

export const IDENTITY_PROVIDERS_OIDC_CLAIM_DISCIPLINE =
  "This OIDC/JWT page reviews discovery, authority, and audience for workspace federation - it is not a signed-review diligence Sources package. Open SSO and identity, Role mapping, or Assurance status when you need hub setup, claim mapping, or trust cites.";

export const IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO =
  "Use these follow-ups when OIDC discovery turns into SSO wizard steps, role mapping, or assurance cites.";


/** Operator Sources - no self-href to OIDC settings. */
export const IDENTITY_PROVIDERS_OIDC_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
