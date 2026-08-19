/** Integration readiness surfaces, ITSM admin connectors, and integration-readiness help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { ADMIN_ITSM_CONNECTORS_CANONICAL_PATH } from "@/lib/admin-itsm-connectors-evidence-copy";
import {
  INTEGRATION_EVENTS_DLQ_CANONICAL_PATH,
} from "@/lib/integration-events-dlq-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_CANONICAL_PATH,
  INTEGRATION_READINESS_HELP_TOPIC_LABEL,
} from "@/lib/integration-readiness-help-evidence-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_OAUTH_CALLBACK_CANONICAL_PATH } from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

export const INTEGRATION_READINESS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: ITSM_OAUTH_CALLBACK_CANONICAL_PATH,
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
    prefix: INTEGRATION_EVENTS_DLQ_CANONICAL_PATH,
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
  {
    prefix: ADMIN_ITSM_CONNECTORS_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "ITSM connectors — configure deployment credentials, native outbound toggles, and tenant routing overrides for Jira and ServiceNow.",
      whatToDoNext:
        "Review connector health probes, complete onboarding for each provider, then open buyer Jira or ServiceNow integration settings when exports need workspace defaults.",
      whyEmpty: "Probe cards and settings load after Internal Operations APIs respond for this deployment.",
      whereToConfigurePrerequisite:
        "Managing ITSM connectors needs System Admin authority; buyer integration pages still need Operate authority in each workspace.",
      whatToDoNextAction: {
        label: "Open Integration readiness",
        href: INTEGRATIONS_READINESS_PATH,
      },
      whereToConfigureAction: {
        label: "Open Jira integration",
        href: "/integrations/jira",
      },
    },
  },
  {
    prefix: INTEGRATION_READINESS_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Integration readiness — ${INTEGRATION_READINESS_HELP_TOPIC_LABEL.toLowerCase()} for notification, ticketing, publishing, and delivery connectors.`,
      whatToDoNext:
        "Open Connection status for live labels, then configure recommended chat connectors before optional ITSM destinations.",
      whyEmpty: "This guide is always available; live connector status appears on Connection status after setup.",
      whereToConfigurePrerequisite:
        "Connector configuration needs a role that can manage integrations for this workspace.",
      whatToDoNextAction: {
        label: "Open Connection status",
        href: "/administration/connection-status",
      },
    },
  },
];
