import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/servicenow-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/servicenow-integration-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
export const SERVICENOW_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE = "ServiceNow integration";

export const SERVICENOW_INTEGRATION_HELP_PAGE_TITLE = "ServiceNow integration";

export const SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE =
  "How outbound ServiceNow incident routing, CMDB behavior, and connection health fit your integration setup.";

export const SERVICENOW_INTEGRATION_HELP_OVERVIEW =
  "ServiceNow integration configures outbound incident routing and CMDB behavior so selected findings and reviews can create ServiceNow records from ArchLucid.";

export const SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION = {
  label: "Open ServiceNow integration",
  href: SERVICENOW_INTEGRATION_CANONICAL_PATH,
} as const;

export const SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE = "Start here";

export const SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG = "ServiceNow connection";

export const SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION =
  "Configure the ServiceNow instance URL and credentials on the integration page before tuning incident routing or CMDB overrides.";
export type ServiceNowIntegrationHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const SERVICENOW_INTEGRATION_HELP_INTEGRATION_READINESS_HREF = inAppHelpHref("integration-readiness");

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
    href: SERVICENOW_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
  },
] as const;

export const SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS = [
  "Test the connector and confirm connection health for this workspace.",
  "Adjust incident routing and CMDB settings so outbound records land in the right ServiceNow tables.",
  "Open Integration readiness or Audit trail when connection or governance trails need follow-up.",
] as const;

export const SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_TITLE = "Before you connect";

export const SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_BODY =
  "Workspace administrators configure ServiceNow outbound routing after secure credential setup — connection health and instance URL come before incident routing and CMDB overrides.";

export const SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID = "help-servicenow-integration-claim-discipline-heading" as const;

export const SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-servicenow-integration-does", title: "What ServiceNow integration does" },
  { level: 2, id: "before-you-connect", title: SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_TITLE },
  { level: 2, id: "how-servicenow-integration-works", title: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
    title: SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
