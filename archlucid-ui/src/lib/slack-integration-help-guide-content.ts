import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import {
  SLACK_INTEGRATION_HELP_SUMMARY,
  SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
  SLACK_INTEGRATION_SECURITY_NOTE,
  SLACK_SETUP_STEP_ADD_DESTINATION,
  SLACK_SETUP_STEP_CREATE_WEBHOOK,
  SLACK_SETUP_STEP_SAVE_DESTINATION,
  SLACK_SETUP_STEP_SEND_TEST,
} from "@/lib/slack-integration-page-copy";

export const SLACK_INTEGRATION_HELP_PAGE_TITLE = SLACK_INTEGRATION_PAGE_TITLE;

export const SLACK_INTEGRATION_HELP_PAGE_SUBTITLE = SLACK_INTEGRATION_PAGE_SUBTITLE;

export const SLACK_INTEGRATION_HELP_OVERVIEW = SLACK_INTEGRATION_HELP_SUMMARY;

export const SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE = "Start here";

export const SLACK_INTEGRATION_HELP_BUYER_START_HERE_HELPER =
  "Review how Slack alert routing works in this workspace — integration admins configure webhooks and destinations on the Slack notifications page.";

export const SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION = SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP;

export const SLACK_INTEGRATION_HELP_READINESS_SECTION_TITLE = "Workspace Slack status";

export const SLACK_INTEGRATION_HELP_READINESS_FORBIDDEN_MESSAGE =
  "Workspace Slack destination status is not available at your current permission level.";

export const SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE = "Credential handling";

export const SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY = SLACK_INTEGRATION_SECURITY_NOTE;

export const SLACK_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Slack notifications",
  href: "/integrations/slack",
} as const;

export const SLACK_INTEGRATION_HELP_SETUP_SECTION_TITLE = "Set up Slack notifications";

export const SLACK_INTEGRATION_HELP_SETUP_STEPS = [
  SLACK_SETUP_STEP_CREATE_WEBHOOK,
  SLACK_SETUP_STEP_ADD_DESTINATION,
  SLACK_SETUP_STEP_SEND_TEST,
  SLACK_SETUP_STEP_SAVE_DESTINATION,
] as const;

export type SlackIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const SLACK_INTEGRATION_HELP_FEATURE_ITEMS: readonly SlackIntegrationHelpItem[] = [
  {
    label: "Incoming webhooks",
    detail: "ArchLucid posts selected alert events to Slack channels you configure.",
  },
  {
    label: "Destination testing",
    detail: "Send a test notification before saving so you know the webhook URL and permissions work.",
  },
  {
    label: "Alert routing",
    detail: "Alerts post when matching alert rules fire and this destination stays enabled.",
  },
] as const;

export const SLACK_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Review delivery history on the Slack notifications page when channels miss expected posts.",
  "Enabled destinations post when matching alert rules fire; disabled destinations pause delivery without deleting saved webhook URLs.",
  "Failed test notifications usually mean the webhook URL, Slack app permissions, or channel access — fix those on the Slack notifications page before re-enabling alert routing.",
] as const;

export const SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID = "help-slack-integration-claim-discipline-heading" as const;

export const SLACK_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-slack-notifications-do", title: "What Slack notifications do" },
  { level: 2, id: "set-up-slack-notifications", title: SLACK_INTEGRATION_HELP_SETUP_SECTION_TITLE },
  { level: 2, id: "how-slack-notifications-work", title: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID,
    title: SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const SLACK_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS = {
  claimMustNotContain: ["sources package", "sealed-review diligence"],
  claimMustContainNegation: ["does not"],
} as const;
