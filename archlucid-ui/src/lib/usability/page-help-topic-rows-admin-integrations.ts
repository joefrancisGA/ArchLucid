/** Integrations and engineering contextual help rows (administration routes). */

import { ADMIN_TENANTS_HELP_TOPIC_LABEL } from "@/lib/admin-tenants-evidence-copy";
import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL } from "@/lib/agent-model-catalog-evidence-copy";
import { API_CONTRACTS_HELP_TOPIC_LABEL } from "@/lib/api-contracts-help-guide-content";
import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";
import { CLI_USAGE_HELP_TOPIC_LABEL } from "@/lib/cli-usage-help-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } from "@/lib/cloud-connections-evidence-copy";
import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL } from "@/lib/cloud-provider-connection-evidence-copy";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } from "@/lib/developer-settings-evidence-copy";
import { ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/engineering-troubleshooting-help-guide-content";
import { EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/extract-upload-settings-evidence-copy";
import { INTEGRATION_EVENTS_DLQ_HELP_TOPIC_LABEL } from "@/lib/integration-events-dlq-evidence-copy";
import { ITSM_CONNECTORS_HELP_TOPIC_LABEL } from "@/lib/admin-itsm-connectors-evidence-copy";
import { ITSM_OAUTH_CALLBACK_HELP_TOPIC_LABEL } from "@/lib/itsm/itsm-oauth-callback-evidence-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";
import {
  INTERNAL_AGENT_MODEL_CATALOG_PATH,
  INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
} from "@/lib/internal-ops-route-paths";
import { PLATFORM_BUNDLED_POLICY_PACKS_HELP_TOPIC_LABEL } from "@/lib/platform-bundled-policy-packs-evidence-copy";

import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_ADMIN_INTEGRATIONS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  {
    prefix: "/help/configuration-reference",
    topic: { slug: "configuration-reference", label: CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cli-usage",
    topic: { slug: "cli-usage", label: CLI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/engineering-troubleshooting",
    topic: { slug: "engineering-troubleshooting", label: ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/api-contracts",
    topic: { slug: "api-contracts", label: API_CONTRACTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/tenants",
    topic: { slug: "enterprise-onboarding", label: ADMIN_TENANTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/advisory-scans",
    topic: { slug: "advisory-scans", label: ADVISORY_SCANS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL },
  },
  { prefix: "/integrations/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/cloud-connections", topic: { slug: "cloud-connections", label: CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/azure-boards", topic: { slug: "azure-boards", label: AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } },
  {
    prefix: "/integrations/jira",
    topic: { slug: "jira-integration", label: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    topic: { slug: "integration-readiness", label: ITSM_OAUTH_CALLBACK_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/servicenow",
    topic: { slug: "servicenow-integration", label: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/slack",
    topic: { slug: "slack-integration", label: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/webhooks",
    topic: { slug: "webhooks-integration", label: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/teams",
    topic: { slug: "teams-integration", label: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/connection-status", topic: { slug: "connection-status", label: CONNECTION_STATUS_HELP_TOPIC_LABEL } },
  { prefix: "/administration/developer", topic: { slug: "cli-usage", label: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } },
  {
    prefix: "/internal/failed-integration-messages",
    topic: { slug: "integration-readiness", label: INTEGRATION_EVENTS_DLQ_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
    topic: { slug: "policy-packs", label: PLATFORM_BUNDLED_POLICY_PACKS_HELP_TOPIC_LABEL },
  },
  { prefix: "/internal/integrations/itsm", topic: { slug: "integration-readiness", label: ITSM_CONNECTORS_HELP_TOPIC_LABEL } },
  {
    prefix: INTERNAL_AGENT_MODEL_CATALOG_PATH,
    topic: { slug: "model-governance", label: AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/extract-upload",
    topic: { slug: "evidence-intake", label: EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL },
  },
];
