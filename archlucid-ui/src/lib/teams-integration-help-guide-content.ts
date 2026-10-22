import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/teams-integration-help-evidence-copy";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import {
  TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS,
  TEAMS_INTEGRATION_HELP_SUMMARY,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_SECURITY_NOTE,
} from "@/lib/teams-integration-page-copy";

export const TEAMS_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE = "Teams integration";

export const TEAMS_INTEGRATION_HELP_PAGE_EYEBROW = "Help topic · Integrations" as const;

export const TEAMS_INTEGRATION_HELP_PAGE_TITLE = TEAMS_INTEGRATION_PAGE_TITLE;

export const TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE =
  "How to configure Teams incoming webhooks, secret references, notification triggers, and test delivery before saving a connection.";

export const TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER =
  "Configure Teams webhooks, secrets, notification triggers, and test delivery in this workspace." as const;

export const TEAMS_INTEGRATION_HELP_PRIMARY_CONTENT_ID = "help-teams-integration-primary-content" as const;

export const TEAMS_INTEGRATION_HELP_SKIP_LINK_LABEL = "Skip to Teams integration guide" as const;

export function teamsIntegrationHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER
    : TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE;
}

export const TEAMS_INTEGRATION_HELP_OVERVIEW = TEAMS_INTEGRATION_HELP_SUMMARY;

export const TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE = "Start here";

export const TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION =
  "You need a Teams incoming webhook stored in your approved secret store before configuring notifications on the Teams notifications page.";

export const TEAMS_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Teams notifications",
  href: "/integrations/teams",
} as const;

export const TEAMS_INTEGRATION_HELP_SETUP_SECTION_TITLE = "Set up Teams notifications";

export const TEAMS_INTEGRATION_HELP_SETUP_STEPS = TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS;

export const TEAMS_INTEGRATION_HELP_SECURITY_SECTION_TITLE = "How webhook secrets are stored";

export const TEAMS_INTEGRATION_HELP_SECURITY_SECTION_ID = "teams-webhook-secret-handling" as const;

export const TEAMS_INTEGRATION_HELP_SECURITY_CALLOUT_BODY = TEAMS_INTEGRATION_SECURITY_NOTE;

export type TeamsIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const TEAMS_INTEGRATION_HELP_FEATURE_ITEMS: readonly TeamsIntegrationHelpItem[] = [
  {
    label: "Teams channel destination",
    detail: "Route selected alert events to a Microsoft Teams channel your operators already monitor.",
  },
  {
    label: "Secret reference",
    detail: "Store the Teams incoming webhook in your approved secret store and reference it by name on this page.",
  },
  {
    label: "Notification triggers",
    detail: "Choose which alert events should post to Teams before saving the connector.",
  },
] as const;

export const TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Alerts post to enabled Teams destinations when matching alert rules fire.",
  "Review delivery history on the Teams notifications page when channels miss expected posts.",
] as const;

export const TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID = "help-teams-integration-claim-discipline-heading" as const;

export const TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-teams-notifications-do", title: "What Teams notifications do" },
  {
    level: 2,
    id: TEAMS_INTEGRATION_HELP_SECURITY_SECTION_ID,
    title: TEAMS_INTEGRATION_HELP_SECURITY_SECTION_TITLE,
  },
  { level: 2, id: "set-up-teams-notifications", title: TEAMS_INTEGRATION_HELP_SETUP_SECTION_TITLE },
  { level: 2, id: "how-teams-notifications-work", title: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    title: TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const TEAMS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS = {
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
