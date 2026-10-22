/** Integrations and cloud-connection contextual help rows. */

import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";
import { AZURE_PERMISSIONS_HELP_TOPIC_LABEL } from "@/lib/azure-permissions-help-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } from "@/lib/cloud-connections-evidence-copy";
import { CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL } from "@/lib/cloud-provider-connection-evidence-copy";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { INTEGRATION_READINESS_HELP_TOPIC_LABEL } from "@/lib/integration-readiness-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_OPERATOR_INTEGRATIONS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  {
    prefix: "/help/azure-boards",
    topic: { slug: "azure-boards", label: AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/integration-readiness",
    topic: { slug: "integration-readiness", label: INTEGRATION_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/aws",
    topic: { slug: "cloud-connections-aws", label: CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/gcp",
    topic: { slug: "cloud-connections-gcp", label: CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/azure-permissions",
    topic: { slug: "azure-permissions", label: AZURE_PERMISSIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections",
    topic: { slug: "cloud-connections", label: CLOUD_CONNECTIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/connection-status",
    topic: { slug: "connection-status", label: CONNECTION_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/slack-integration",
    topic: { slug: "slack-integration", label: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/teams-integration",
    topic: { slug: "teams-integration", label: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/webhooks-integration",
    topic: { slug: "webhooks-integration", label: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/api-keys",
    topic: { slug: "api-keys", label: API_KEYS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/jira-integration",
    topic: { slug: "jira-integration", label: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/servicenow-integration",
    topic: { slug: "servicenow-integration", label: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  },
];
