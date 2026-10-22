import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF } from "@/lib/identity-providers-settings-copy";

export const IDENTITY_PROVIDERS_OIDC_CANONICAL_PATH =
  "/administration/identity-providers/oidc" as const;

export const IDENTITY_PROVIDERS_OIDC_HELP_TOPIC_LABEL = "How OIDC federation works" as const;

export const IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE = "Where to go next";

export const IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO =
  "Use these follow-ups when OIDC discovery turns into SSO wizard steps, role mapping, or official assurance materials.";

/** Operator Sources - no self-href to OIDC settings. */
export const IDENTITY_PROVIDERS_OIDC_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Enterprise onboarding help", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Role mapping", href: "/administration/identity-providers/role-mapping" },
  { label: "Identity diagnostics", href: "/administration/identity-providers/diagnostics" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

const IDENTITY_PROVIDERS_OIDC_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  "/administration/identity/sso-wizard",
]);

/** Orientation-strip Sources — excludes on-page diagnostics and SSO wizard CTAs. */
export const IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  IDENTITY_PROVIDERS_OIDC_SOURCES.filter(
    (source) => !IDENTITY_PROVIDERS_OIDC_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
