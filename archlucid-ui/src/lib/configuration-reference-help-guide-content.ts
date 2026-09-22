import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONFIGURATION_REFERENCE_HELP_PAGE_TITLE = "Configuration reference";

export const CONFIGURATION_REFERENCE_HELP_BREADCRUMB_TOPIC_TITLE = "Configuration reference" as const;

export const CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL = "How configuration reference works" as const;

export const CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE =
  "Admin task guide for identity/SSO and production-like hosting posture — open the matching settings surface, then expand the key catalog only when needed.";

export const CONFIGURATION_REFERENCE_HELP_OVERVIEW =
  "Use this page when you need the next settings action for auth or hosted secrets. The full key catalog stays collapsed below as an Admin technical appendix.";

export const CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE =
  "This guide orients Admin configuration tasks inside the product. It is not buyer self-serve product help and not a certification evidence pack.";

export const CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_ID = "open-configuration-surfaces" as const;

export const CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_TITLE = "Open configuration surfaces" as const;

export const CONFIGURATION_REFERENCE_HELP_TASKS_SECTION_ID = "common-admin-tasks" as const;

export const CONFIGURATION_REFERENCE_HELP_TASKS_SECTION_TITLE = "Common Admin tasks" as const;

export const CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID = "key-catalog" as const;

export const CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SUMMARY_LABEL =
  "Full key catalog (Admin technical appendix)" as const;

export const CONFIGURATION_REFERENCE_HELP_PROVENANCE_DISCLOSURE_TITLE = "Source document" as const;

export type ConfigurationReferenceHelpTaskSection = {
  readonly title: string;
  readonly body: string;
  readonly status?: {
    readonly kind: "neutral" | "blocked";
    readonly label: string;
  };
};

export const CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS: readonly ConfigurationReferenceHelpTaskSection[] =
  [
    {
      title: "Identity and SSO",
      body: "Configure workforce sign-in with the SSO wizard, then confirm identity providers and role mapping. Use Users and roles help when you need permission semantics rather than IdP wiring.",
    },
    {
      title: "Automation credentials",
      status: {
        kind: "neutral",
        label: "Not available in product",
      },
      body: "Prefer managed identity and Key Vault for hosted secrets; do not paste raw connection strings into evidence bundles.",
    },
    {
      title: "Hosting and secrets posture",
      body: "Production-like hosts require Key Vault-backed secrets and honest auth mode (JWT/OIDC or SAML as contracted). Open the Admin configuration summary for the live key snapshot after settings changes.",
    },
  ] as const;

export const CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS = {
  openSsoWizard: {
    label: "Open SSO wizard",
    href: "/administration/identity/sso-wizard",
  },
  openIdentityProviders: {
    label: "Open identity providers",
    href: "/administration/identity-providers",
  },
  openConfigurationSummary: {
    label: "Open configuration summary",
    href: "/internal/configuration",
  },
} as const;

export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING =
  "Which guide should you open?" as const;

export const CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID = "which-guide" as const;

export const CONFIGURATION_REFERENCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_ID, title: CONFIGURATION_REFERENCE_HELP_ACTION_PANEL_TITLE, level: 2 },
  { id: "identity-and-sso", title: "Identity and SSO", level: 2 },
  { id: "automation-credentials", title: "Automation credentials", level: 2 },
  { id: "hosting-and-secrets-posture", title: "Hosting and secrets posture", level: 2 },
  { id: CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING_ID, title: CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING, level: 2 },
  { id: CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID, title: CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SUMMARY_LABEL, level: 2 },
] as const;

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
