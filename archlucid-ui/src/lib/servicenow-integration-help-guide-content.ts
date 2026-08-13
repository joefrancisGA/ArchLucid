import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/servicenow-integration-evidence-copy";
import {
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_PAGE_SUBTITLE,
} from "@/lib/servicenow-integration-page-copy";

export const SERVICENOW_INTEGRATION_HELP_PAGE_TITLE = SERVICENOW_INTEGRATION_PAGE_TITLE;

export const SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE = SERVICENOW_PAGE_SUBTITLE;

export const SERVICENOW_INTEGRATION_HELP_OVERVIEW =
  "ServiceNow integration configures outbound incident routing and CMDB behavior so selected findings and reviews can create ServiceNow records from ArchLucid.";

export const SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open ServiceNow integration",
  href: SERVICENOW_INTEGRATION_CANONICAL_PATH,
} as const;

export type ServiceNowIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const SERVICENOW_INTEGRATION_HELP_FEATURE_ITEMS: readonly ServiceNowIntegrationHelpItem[] = [
  {
    label: "Connection health",
    detail: "Test the connector and review last-checked status before relying on outbound routing.",
  },
  {
    label: "Incident routing",
    detail: "Configure how findings and reviews create ServiceNow incidents for this workspace.",
  },
  {
    label: "CMDB overrides",
    detail: "Adjust CMDB auto-create behavior when operational records need custom handling.",
  },
  {
    label: "Integration readiness",
    detail: "Open integration readiness when multiple connectors need procurement-oriented setup guidance.",
  },
] as const;

export const SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Test the connector and confirm connection health for this workspace.",
  "Adjust incident routing and CMDB settings so outbound records land in the right ServiceNow tables.",
  "Open integration readiness or audit when connection or governance trails need follow-up.",
] as const;

export const SERVICENOW_INTEGRATION_HELP_READINESS_HREF = "/help/integration-readiness";

export const SERVICENOW_INTEGRATION_HELP_JIRA_HREF = "/integrations/jira";

export const SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-servicenow-integration-does", title: "What ServiceNow integration does" },
  { level: 2, id: "how-servicenow-integration-works", title: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
