import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/api-keys-help-evidence-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const API_KEYS_HELP_PAGE_TITLE = "API keys";

export const API_KEYS_HELP_PAGE_SUBTITLE =
  "Where workspace automation credentials live in this release, and how people access is governed instead.";

export const API_KEYS_HELP_OVERVIEW =
  "API key management is not available in this release. API keys are workspace automation credentials for approved enterprise configurations — host automation uses deployment-held secrets, and people access is governed under Users and roles, not through keys created in this product.";

export const API_KEYS_HELP_RELEASE_STATUS_LABEL = "Not in this release";

export const API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE =
  "People access is governed under Users and roles. Host automation credentials are held in deployment configuration (Key Vault or app settings).";

export type ApiKeysHelpPrimaryAction = {
  readonly label: string;
  readonly href: string;
  readonly variant: "primary" | "outline";
};

export const API_KEYS_HELP_PRIMARY_ACTIONS = {
  usersAndRoles: {
    label: "Users and roles",
    href: "/administration/users",
    variant: "primary",
  },
  cliUsageHelp: {
    label: "CLI usage help",
    href: CLI_USAGE_HELP_PATH,
    variant: "outline",
  },
  audit: {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    variant: "outline",
  },
} as const satisfies Record<string, ApiKeysHelpPrimaryAction>;

export const API_KEYS_HELP_ACTION_PANEL_ID = "not-in-this-release-what-to-use-instead";

export const API_KEYS_HELP_ACTION_PANEL_TITLE = "Not in this release — what to use instead";

export const API_KEYS_HELP_ACTION_PANEL_INTRO =
  "Use these live follow-ups when automation credential questions need membership controls, scripting guidance, or governed audit trails.";

export type ApiKeysHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const API_KEYS_HELP_FEATURE_ITEMS: readonly ApiKeysHelpItem[] = [
  {
    label: "CI packaging and inventory export",
    detail:
      "In enterprise configurations, pipeline steps call ArchLucid packaging scripts or upload inventory bundles using credentials held in deployment configuration — not through an in-product key manager.",
  },
  {
    label: "Scheduled evidence collection",
    detail:
      "Host services that poll connectors or export review evidence on a schedule rely on deployment-held secrets when no in-product API key surface is available.",
  },
  {
    label: "Governed people access",
    detail:
      "Interactive operators sign in through Users and roles for membership, SSO, and role assignment — not API keys created in this product.",
  },
  {
    label: "Host-held credentials",
    detail:
      "Key Vault or app settings store automation secrets for approved configurations until an in-product key manager ships.",
  },
] as const;

export const API_KEYS_HELP_INSTEAD_SECTION_ID = "what-to-do-instead";

export const API_KEYS_HELP_INSTEAD_SECTION_TITLE = "What to do instead in this release";

export const API_KEYS_HELP_HOW_TO_READ_STEPS = [
  "Confirm who may administer workspace membership and automation access policies before changing deployment credentials.",
  "Review how host automation authenticates when keys are held outside the product UI.",
  "Record credential or access changes in Audit when assurance follow-up is required.",
] as const;

export const API_KEYS_HELP_CLAIM_HEADING_ID = "help-api-keys-claim-discipline-heading" as const;

export const API_KEYS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: API_KEYS_HELP_ACTION_PANEL_ID, title: API_KEYS_HELP_ACTION_PANEL_TITLE },
  { level: 2, id: "what-api-keys-are-for", title: "What API keys are for" },
  { level: 2, id: API_KEYS_HELP_INSTEAD_SECTION_ID, title: API_KEYS_HELP_INSTEAD_SECTION_TITLE },
  {
    level: 2,
    id: API_KEYS_HELP_CLAIM_HEADING_ID,
    title: API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
