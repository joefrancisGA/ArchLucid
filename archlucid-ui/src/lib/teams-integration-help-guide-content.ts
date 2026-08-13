import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import {
  TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_SECURITY_NOTE,
} from "@/lib/teams-integration-page-copy";

export const TEAMS_INTEGRATION_HELP_PAGE_TITLE = TEAMS_INTEGRATION_PAGE_TITLE;

export const TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE = TEAMS_INTEGRATION_PAGE_SUBTITLE;

export const TEAMS_INTEGRATION_HELP_OVERVIEW = TEAMS_INTEGRATION_CONNECT_SECTION_LEAD;

export const TEAMS_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Teams notifications",
  href: "/integrations/teams",
} as const;

export type TeamsIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const TEAMS_INTEGRATION_HELP_FEATURE_ITEMS: readonly TeamsIntegrationHelpItem[] = [
  {
    label: "Teams channel destination",
    detail: "Route selected governance alert events to a Microsoft Teams channel your operators already monitor.",
  },
  {
    label: "Secret reference",
    detail: "Store the Teams incoming webhook in your approved secret store and reference it by name on this page.",
  },
  {
    label: "Notification triggers",
    detail: "Choose which governance events should post to Teams before saving the connector.",
  },
  {
    label: "Security posture",
    detail: TEAMS_INTEGRATION_SECURITY_NOTE,
  },
] as const;

export const TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Prepare a Teams incoming webhook and store it in your approved secret store.",
  "Enter the secret reference, select triggers, and send a test notification.",
  "Open Alert rules when the connector works but the wrong events fire.",
] as const;

export const TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF = "/governance/alert-rules";

export const TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-teams-notifications-do", title: "What Teams notifications do" },
  { level: 2, id: "how-teams-notifications-work", title: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
