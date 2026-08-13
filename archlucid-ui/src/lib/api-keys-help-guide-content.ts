import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
import {
  API_KEYS_PAGE_SUBTITLE,
  API_KEYS_PAGE_TITLE,
  API_KEYS_RESTRICTED_DESCRIPTION,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
} from "@/lib/api-keys-settings-copy";

export const API_KEYS_HELP_PAGE_TITLE = API_KEYS_PAGE_TITLE;

export const API_KEYS_HELP_PAGE_SUBTITLE = API_KEYS_PAGE_SUBTITLE;

export const API_KEYS_HELP_OVERVIEW =
  "API keys are workspace automation credentials for approved enterprise configurations. Use them for scripted access — not as a substitute for people sign-in, governed audit trails, or procurement diligence packages.";

export const API_KEYS_HELP_PRIMARY_ACTION = {
  label: "Open API keys",
  href: "/administration/api-keys",
} as const;

export type ApiKeysHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const API_KEYS_HELP_FEATURE_ITEMS: readonly ApiKeysHelpItem[] = [
  {
    label: "Admin and read-only keys",
    detail: "Rotate overlap keys when automation needs continuity during credential changes.",
  },
  {
    label: "Workspace availability",
    detail: API_KEYS_SURFACE_DISABLED_DESCRIPTION,
  },
  {
    label: "Restricted tenants",
    detail: API_KEYS_RESTRICTED_DESCRIPTION,
  },
  {
    label: "People access",
    detail: "Interactive operators still use Users and roles — API keys do not replace membership controls.",
  },
] as const;

export const API_KEYS_HELP_HOW_TO_READ_STEPS = [
  "Confirm API key management is enabled for your workspace before rotating credentials.",
  "Issue overlap keys when automation cannot tolerate an immediate rotation window.",
  "Open Audit or CLI usage help when rotation turns into membership, scripting, or assurance questions.",
] as const;

export const API_KEYS_HELP_CLI_USAGE_HREF = "/help/cli-usage";

export const API_KEYS_HELP_USERS_HREF = "/help/users-and-roles";

export const API_KEYS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-api-keys-are-for", title: "What API keys are for" },
  { level: 2, id: "how-api-keys-work", title: API_KEYS_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
