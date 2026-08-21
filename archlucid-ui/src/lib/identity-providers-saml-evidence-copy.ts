import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const IDENTITY_PROVIDERS_SAML_CANONICAL_PATH =
  "/administration/identity-providers/saml" as const;

export const IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL = "How SAML federation works" as const;

export const IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE = "Where to go next";

export const IDENTITY_PROVIDERS_SAML_SOURCES_INTRO =
  "Use these follow-ups when SAML SP configuration turns into SSO wizard steps, role mapping, diagnostics, or official assurance materials.";

/** Operator Sources - no self-href to SAML settings. */
export const IDENTITY_PROVIDERS_SAML_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
