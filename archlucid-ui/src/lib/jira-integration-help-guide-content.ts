import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/jira-integration-evidence-copy";
import {
  JIRA_CONNECT_WITH_ATLASSIAN_LABEL,
  JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD,
} from "@/lib/jira-integration-page-copy";

export const JIRA_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE = "Jira integration";

export const JIRA_INTEGRATION_HELP_PAGE_TITLE = "Jira integration";

export const JIRA_INTEGRATION_HELP_PAGE_SUBTITLE =
  "How outbound Jira work-item routing, connection health, and workspace mappings fit your integration setup.";

export const JIRA_INTEGRATION_HELP_OVERVIEW =
  "Jira integration configures outbound work-item routing — project keys, severity filters, and issue-type mappings — so findings and reviews can create Jira issues from ArchLucid.";

export const JIRA_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open Jira integration",
  href: JIRA_INTEGRATION_CANONICAL_PATH,
} as const;

export const JIRA_INTEGRATION_HELP_START_HERE_CARD_TITLE = "Start here";

export const JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG = "Atlassian connection";

export const JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION = JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD;

export type JiraIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const JIRA_INTEGRATION_HELP_FEATURE_ITEMS: readonly JiraIntegrationHelpItem[] = [
  {
    label: "Connection health",
    detail: "Test the connector and review last-checked status before relying on outbound routing.",
  },
  {
    label: "Workspace routing",
    detail: "Set project keys, severity filters, and issue-type mappings for this workspace.",
  },
  {
    label: JIRA_CONNECT_WITH_ATLASSIAN_LABEL,
    detail: "Connect with Atlassian when the workspace needs cloud credential setup.",
  },
  {
    label: "Integration readiness",
    detail: "Open integration readiness when multiple connectors need procurement-oriented setup guidance.",
  },
] as const;

export const JIRA_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Test the connector and confirm connection health for this workspace.",
  "Set project and severity mappings so outbound issues route to the right Jira project.",
  "Open Integration readiness or Audit trail when connection or governance trails need follow-up.",
] as const;

export const JIRA_INTEGRATION_HELP_BEFORE_YOU_START_TITLE = "Before you start";

export const JIRA_INTEGRATION_HELP_BEFORE_YOU_START_BODY =
  "Workspace administrators configure Jira outbound routing after Atlassian OAuth succeeds — connection health and credential setup come before project keys and severity mappings.";

export const JIRA_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-jira-integration-does", title: "What Jira integration does" },
  { level: 2, id: "how-jira-integration-works", title: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  { level: 2, id: "before-you-start", title: JIRA_INTEGRATION_HELP_BEFORE_YOU_START_TITLE },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
