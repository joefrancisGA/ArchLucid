import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import {
  SLACK_INTEGRATION_HELP_SUMMARY,
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

export const SLACK_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Slack notifications",
  href: "/integrations/slack",
} as const;

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
    detail: "ArchLucid posts selected governance alert events to Slack channels you configure.",
  },
  {
    label: "Destination testing",
    detail: "Send a test notification before saving so you know the webhook URL and permissions work.",
  },
  {
    label: "Alert routing",
    detail: "Open Alert rules when you need to change which events fire Slack notifications.",
  },
  {
    label: "Credential handling",
    detail: SLACK_INTEGRATION_SECURITY_NOTE,
  },
] as const;

export const SLACK_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Create a dedicated Slack incoming webhook for ArchLucid governance alerts.",
  "Add destination details, send a successful test, then save the destination.",
  "Open Alert rules when notifications fire but the wrong events reach Slack.",
] as const;

export const SLACK_INTEGRATION_HELP_ALERT_RULES_HREF = "/governance/alert-rules";

export const SLACK_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-slack-notifications-do", title: "What Slack notifications do" },
  { level: 2, id: "how-slack-notifications-work", title: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
