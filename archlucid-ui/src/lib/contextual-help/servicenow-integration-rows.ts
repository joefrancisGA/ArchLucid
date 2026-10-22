/** ServiceNow integration surface and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/servicenow-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/servicenow-integration-help-evidence-copy";

const SERVICENOW_INTEGRATION_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "ServiceNow integration — outbound incident settings, connection health, and CMDB overrides for creating ServiceNow records from ArchLucid.",
  whatToDoNext:
    "Test the connector, adjust CMDB auto-create if needed, then open Integration readiness when the path is not ready.",
  whyEmpty: "Health and settings load after this workspace can reach the ITSM connector configuration.",
  whereToConfigurePrerequisite:
    "Platform credentials are often configured by an administrator; tenant overrides on this page need Operate authority.",
  taskSteps: [
    "Test the connector to confirm ServiceNow credentials and routing work.",
    "Adjust CMDB auto-create settings when incidents need asset linkage.",
    "Open Integration readiness when the connector path is not ready yet.",
  ],
} as const;

export const SERVICENOW_INTEGRATION_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: SERVICENOW_INTEGRATION_CANONICAL_PATH,
    entry: SERVICENOW_INTEGRATION_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `ServiceNow integration — ${SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL.toLowerCase()} and when to open integration readiness or audit.`,
      whatToDoNext:
        "Open ServiceNow integration to test the connector and adjust routing, then follow integration readiness help for cross-connector setup.",
      whyEmpty: "This guide is always available; health rows load after the ITSM connector configuration responds.",
      whereToConfigurePrerequisite:
        "Integration readiness help covers procurement-oriented setup guidance across connector families.",
      whatToDoNextAction: {
        label: "Open ServiceNow integration",
        href: SERVICENOW_INTEGRATION_CANONICAL_PATH,
      },
      whereToConfigureAction: {
        label: "Read integration readiness help",
        href: "/help/integration-readiness",
      },
    },
  },
];
