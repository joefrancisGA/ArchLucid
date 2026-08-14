import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_CANONICAL_PATH =
  "/administration/identity-providers/diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL = "How identity diagnostics work" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE = "Where to go next";

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
