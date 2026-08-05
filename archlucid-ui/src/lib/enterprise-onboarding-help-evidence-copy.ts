import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH = "/help/enterprise-onboarding" as const;

export const ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE =
  "This enterprise onboarding checklist is operator orientation for SSO, identity, and hosted tenant setup - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Identity providers, Security and trust, or Audit when you need live packages or assurance claims.";

export const ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO =
  "Use these follow-ups when onboarding checklist steps turn into identity setup, roles, cloud attachment, or assurance orientation.";

export type EnterpriseOnboardingHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/help/enterprise-onboarding`. */
export const ENTERPRISE_ONBOARDING_HELP_SOURCES: readonly EnterpriseOnboardingHelpSourceLink[] = [
  { label: "Identity providers", href: "/administration/settings/identity-providers" },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Security & trust hub", href: "/security-trust" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
