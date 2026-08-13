import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const API_KEYS_HELP_PAGE_TITLE = "API keys";

export const API_KEYS_HELP_PAGE_SUBTITLE =
  "Where workspace automation credentials live in this release, and how people access is governed instead.";

export const API_KEYS_HELP_OVERVIEW =
  "API keys are workspace automation credentials for approved enterprise configurations. Use them for scripted access — not as a substitute for people sign-in, governed audit trails, or procurement diligence packages.";

export const API_KEYS_HELP_RELEASE_STATUS_LABEL = "Not in this release";

export const API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE =
  "API key management is not available in this release. People access is governed under Users and roles. Host automation credentials are held in deployment configuration (Key Vault or app settings).";

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

export const API_KEYS_HELP_ACTION_PANEL_ID = "where-to-go-in-this-release";

export const API_KEYS_HELP_ACTION_PANEL_TITLE = "Where to go in this release";

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
      "Pipeline steps that call ArchLucid packaging scripts or upload inventory bundles without interactive sign-in.",
  },
  {
    label: "Scheduled evidence collection",
    detail: "Host services that poll connectors or export review evidence on a recurrence schedule.",
  },
  {
    label: "Governed people access",
    detail:
      "Interactive operators use Users and roles for membership, SSO, and role assignment — API keys do not replace those controls.",
  },
  {
    label: "Host-held credentials",
    detail:
      "Deployment configuration (Key Vault or app settings) stores automation secrets when no in-product key manager is available.",
  },
] as const;

export const API_KEYS_HELP_INSTEAD_SECTION_ID = "what-to-do-instead";

export const API_KEYS_HELP_INSTEAD_SECTION_TITLE = "What to do instead in this release";

export const API_KEYS_HELP_HOW_TO_READ_STEPS = [
  "Open Users and roles to review who can administer workspace membership and automation access policies.",
  "Read CLI usage help for how host automation authenticates when keys are held outside the product UI.",
  "Open Audit when credential changes need a governed trail or assurance follow-up.",
] as const;

export type ApiKeysHelpStepFollowUpLink = {
  readonly label: string;
  readonly href: string;
};

/** Supplemental step links — CLI and users help already appear in the action panel and Sources band. */
export const API_KEYS_HELP_STEP_FOLLOW_UP_LINKS: readonly ApiKeysHelpStepFollowUpLink[] = [
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const API_KEYS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: API_KEYS_HELP_ACTION_PANEL_ID, title: API_KEYS_HELP_ACTION_PANEL_TITLE },
  { level: 2, id: "what-api-keys-are-for", title: "What API keys are for" },
  { level: 2, id: API_KEYS_HELP_INSTEAD_SECTION_ID, title: API_KEYS_HELP_INSTEAD_SECTION_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
