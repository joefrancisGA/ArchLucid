import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/teams-integration-help-evidence-copy";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import {
  TEAMS_INTEGRATION_HELP_SUMMARY,
  TEAMS_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_SECURITY_NOTE,
  TEAMS_SETUP_STEP_CREATE_WEBHOOK,
  TEAMS_SETUP_STEP_ENTER_SECRET,
  TEAMS_SETUP_STEP_SAVE_CONNECTION,
  TEAMS_SETUP_STEP_SEND_TEST,
} from "@/lib/teams-integration-page-copy";

export const TEAMS_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE = "Teams integration";

export const TEAMS_INTEGRATION_HELP_PAGE_TITLE = TEAMS_INTEGRATION_PAGE_TITLE;

export const TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE = TEAMS_INTEGRATION_PAGE_SUBTITLE;

export const TEAMS_INTEGRATION_HELP_OVERVIEW = TEAMS_INTEGRATION_HELP_SUMMARY;

export const TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE = "Start here";

export const TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION_TAG = "Incoming webhook";

export const TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION = TEAMS_INTEGRATION_NOT_CONFIGURED_NEXT_STEP;

export const TEAMS_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Teams notifications",
  href: "/integrations/teams",
} as const;

export const TEAMS_INTEGRATION_HELP_SETUP_SECTION_TITLE = "Set up Teams notifications";

export const TEAMS_INTEGRATION_HELP_SETUP_STEPS = [
  TEAMS_SETUP_STEP_CREATE_WEBHOOK,
  TEAMS_SETUP_STEP_ENTER_SECRET,
  TEAMS_SETUP_STEP_SEND_TEST,
  TEAMS_SETUP_STEP_SAVE_CONNECTION,
] as const;

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
  "Governance alerts post to enabled Teams destinations when matching alert rules fire.",
  "Review delivery history on the Teams notifications page when channels miss expected posts.",
  "Open Integration readiness when Teams is one of several connectors under procurement review.",
] as const;

export const TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID = "help-teams-integration-claim-discipline-heading" as const;

export const TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-teams-notifications-do", title: "What Teams notifications do" },
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
