/** Integration and connector routes (`/integrations/**`, integration-event DLQ). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";

export const INTEGRATIONS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: "/integrations/cloud-connections",
    entry: {
      whatIsThisPage:
        "Connect Azure, AWS, or Google Cloud for optional read-only evidence collection, or start evidence-only reviews without a cloud connector.",
      whatToDoNext:
        "Choose platforms to show, open a provider to configure federation, or start an evidence-only review from uploaded packages.",
      whyEmpty:
        "Provider cards stay Not connected until you configure a Tier 2 connection; evidence-only upload stays available anytime.",
      whereToConfigurePrerequisite:
        "Choose a workspace in the header scope switcher before changing which platforms appear — filters save per workspace.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/aws",
    entry: {
      whatIsThisPage:
        "AWS cloud connection — configure a read-only federated IAM role for Resource Explorer inventory collection.",
      whatToDoNext:
        "Complete security preflight, enter the role ARN, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a federated role.",
      whereToConfigurePrerequisite:
        "Creating the IAM trust role usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    entry: {
      whatIsThisPage:
        "Azure cloud connection — configure read-only federated service-principal access for subscription inventory collection.",
      whatToDoNext:
        "Complete security preflight, run the Tier 2 wizard, save and validate, then return to Cloud connections for workspace status.",
      whyEmpty: "Saved connections and recent collection runs appear after you validate federated credentials.",
      whereToConfigurePrerequisite:
        "Provisioning the service principal usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/cloud-connections/gcp",
    entry: {
      whatIsThisPage:
        "GCP cloud connection — configure read-only Cloud Asset Inventory through Workload Identity Federation.",
      whatToDoNext:
        "Complete security preflight, record the pool provider and service-account email, save the connection, then re-poll to validate access.",
      whyEmpty: "Saved connections and last poll timestamps appear after you save a project.",
      whereToConfigurePrerequisite:
        "Provisioning Workload Identity Federation usually needs cloud-admin authority; saving the connection in ArchLucid needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/jira",
    entry: {
      whatIsThisPage:
        "Jira integration — outbound work-item settings, connection health, and tenant overrides for creating Jira issues from ArchLucid.",
      whatToDoNext:
        "Test the connector, set project and severity mappings, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/integrations/azure-boards",
    entry: {
      whatIsThisPage:
        "Azure Boards integration — outbound work-item settings, connection health, and default behavior for creating Azure Boards work items from ArchLucid.",
      whatToDoNext:
        "Test the connector, set organization project and work-item defaults, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the Azure Boards connector configuration.",
      whereToConfigurePrerequisite:
        "Organization URL and credential references are often configured by an administrator; saving settings needs Operate authority.",
    },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    entry: {
      whatIsThisPage:
        "Atlassian OAuth callback — completes Jira connector consent after Atlassian redirects back to ArchLucid.",
      whatToDoNext:
        "When consent succeeds, return to Jira integration settings to run a health probe; on failure, retry Connect with Atlassian.",
      whyEmpty: "This page only appears after an OAuth redirect; status text replaces empty layouts.",
      whereToConfigurePrerequisite:
        "Starting OAuth requires Operate authority and a configured Atlassian app registration.",
    },
  },
  {
    prefix: "/integrations/servicenow",
    entry: {
      whatIsThisPage:
        "ServiceNow integration — outbound incident settings, connection health, and CMDB overrides for creating ServiceNow records from ArchLucid.",
      whatToDoNext:
        "Test the connector, adjust CMDB auto-create if needed, then open Integration readiness when the path is not ready.",
      whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
      whereToConfigurePrerequisite:
        "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
    },
  },
  {
    prefix: "/operate/integration-events/dlq",
    entry: {
      whatIsThisPage:
        "Integration event dead letters — Internal Operations queue for outbound integration publishes that exceeded retries.",
      whatToDoNext:
        "Inspect the failing event, fix connector or destination root cause, then retry or suppress; open Integration readiness or System health for posture.",
      whyEmpty: "An empty list means no dead-lettered outbox rows are waiting across tenants.",
      whereToConfigurePrerequisite:
        "Admin authority is required to retry or suppress; the queue spans all tenants, not only the header workspace.",
    },
  },
];
