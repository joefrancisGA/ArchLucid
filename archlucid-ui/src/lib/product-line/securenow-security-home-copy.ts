import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import {
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { secureNowCloudInventoryEvidenceSummary } from "@/lib/product-line/securenow-cloud-platform-policy";

import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SECURITY_HOME_SECTION_HEADING = "Security" as const;

export const SECURENOW_SECURITY_HOME_SECTION_LEAD =
  "Triage assigned findings, run remediation factory workflows, and connect cloud inventory and outbound ticketing integrations." as const;

/** SecureNow home — operational security destinations and integrations. */
export const SECURENOW_SECURITY_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
    summary: "Open findings assigned to you for remediation and follow-up.",
    recommendedFirst: true,
  },
  {
    href: "/governance/remediation-factory",
    label: OPERATOR_NAV_LINK_LABELS.remediationFactory,
    summary: "Prioritize remediation waves and review executive remediation metrics.",
  },
  {
    href: "/governance/remediation-patterns",
    label: OPERATOR_NAV_LINK_LABELS.remediationPatterns,
    summary: "Create, review, approve, and import remediation patterns for repeatable fixes.",
  },
  {
    href: CLOUD_CONNECTIONS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.cloudConnections,
    summary: secureNowCloudInventoryEvidenceSummary(),
  },
  {
    href: INTEGRATIONS_JIRA_PATH,
    label: OPERATOR_NAV_LINK_LABELS.jira,
    summary: "Route findings and remediation work items into Jira projects.",
  },
  {
    href: INTEGRATIONS_SERVICENOW_PATH,
    label: OPERATOR_NAV_LINK_LABELS.servicenow,
    summary: "Send findings and remediation updates into ServiceNow incidents and tasks.",
  },
  {
    href: INTEGRATIONS_TEAMS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.microsoftTeams,
    summary: "Deliver alerts and workflow notifications to Microsoft Teams channels.",
  },
];
