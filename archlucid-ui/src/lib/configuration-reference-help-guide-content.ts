import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONFIGURATION_REFERENCE_HELP_PAGE_TITLE = "Configuration reference";

export const CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL = "How configuration reference works" as const;

export const CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE =
  "Admin task guide: map identity/SSO and production-like hosting posture — then open the matching settings surface. Not buyer self-serve product help.";

export const CONFIGURATION_REFERENCE_HELP_OVERVIEW =
  "Use this page when you need the next settings action for auth or hosted secrets — not when you need a raw engineering key dump. The full key catalog stays collapsed below as an Admin technical appendix. Non-Admin architects should use Authentication sign-in, Users and roles, or Enterprise onboarding instead.";

export const CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE =
  "This guide orients Admin configuration tasks inside the product. It is not a certification evidence pack";

export type ConfigurationReferenceHelpTaskSection = {
  readonly title: string;
  readonly body: string;
};

export const CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS: readonly ConfigurationReferenceHelpTaskSection[] =
  [
    {
      title: "Identity and SSO",
      body: "Configure workforce sign-in with the SSO wizard, then confirm identity providers and role mapping. Use Users and roles help when you need permission semantics rather than IdP wiring.",
    },
    {
      title: "Automation credentials",
      body: "In-product API key management is parked at current product maturity. Prefer managed identity and Key Vault for hosted secrets; do not paste raw connection strings into evidence bundles.",
    },
    {
      title: "Hosting and secrets posture",
      body: "Production-like hosts require Key Vault-backed secrets and honest auth mode (JWT/OIDC or SAML as contracted). Open the Admin configuration summary for the live key snapshot after settings changes.",
    },
  ] as const;

export const CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS = {
  openSsoWizard: {
    label: "Configure SSO",
    href: "/administration/identity/sso-wizard",
  },
  openIdentityProviders: {
    label: "Identity providers",
    href: "/administration/identity-providers",
  },
  openConfigurationSummary: {
    label: "Configuration summary",
    href: "/internal/configuration",
  },
} as const;

export type ConfigurationReferenceHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Sponsor-safe / Admin Sources — no self-href to this topic. */
export const CONFIGURATION_REFERENCE_HELP_SOURCES: readonly ConfigurationReferenceHelpSourceLink[] = [
  { label: "Authentication sign-in", href: inAppHelpHref("authentication-sign-in") },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Enterprise onboarding", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  {
    label: "Data handling and tenant isolation",
    href: inAppHelpHref("data-handling"),
  },
] as const;

export const CONFIGURATION_REFERENCE_HELP_CANONICAL_PATH = CONFIGURATION_REFERENCE_HELP_PATH;
