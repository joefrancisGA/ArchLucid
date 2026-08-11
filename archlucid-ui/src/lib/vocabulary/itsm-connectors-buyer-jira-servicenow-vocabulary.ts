/**
 * TB-2324 — Admin ITSM connectors ≠ buyer Jira ≠ buyer ServiceNow vocabulary triad.
 *
 * Why three surfaces exist:
 * - ITSM connectors (`/internal/integrations/itsm`) is the admin surface for
 *   connector credentials, routing, and connector health.
 * - Jira (`/integrations/jira`) is the buyer product integration setup for Jira.
 * - ServiceNow (`/integrations/servicenow`) is the buyer product integration
 *   setup for ServiceNow.
 *
 * They stay separate because admin connector credentials/health is not buyer
 * product integration setup. Distinct from ITSM connectors ≠ Finding ticket
 * linkage (TB-2310).
 */

import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm-connectors-admin-scope";

export type ItsmConnectorsBuyerJiraServicenowSurfaceId =
  | "itsm-connectors"
  | "jira"
  | "servicenow";

export type ItsmConnectorsBuyerJiraServicenowLink = {
  readonly id: ItsmConnectorsBuyerJiraServicenowSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ItsmConnectorsBuyerJiraServicenowVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly itsmConnectorsLink: ItsmConnectorsBuyerJiraServicenowLink;
  readonly jiraLink: ItsmConnectorsBuyerJiraServicenowLink;
  readonly serviceNowLink: ItsmConnectorsBuyerJiraServicenowLink;
};

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING =
  "ITSM connectors, Jira, and ServiceNow do different jobs" as const;

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE =
  "ITSM connectors is the admin surface for connector credentials, routing, and connector health. Jira and ServiceNow under Integrations are buyer product integration setup for those tools. Configuring admin connector credentials and health is not the same as buyer Jira or ServiceNow product integration setup." as const;

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE =
  "ITSM connectors is admin credentials/health; Jira and ServiceNow are buyer product integration setup — open the other when you need that job." as const;

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK: ItsmConnectorsBuyerJiraServicenowLink =
  {
    id: "itsm-connectors",
    label: "ITSM connectors",
    href: ITSM_CONNECTORS_ADMIN_PATH,
    whenToUse: "Configure admin connector credentials, routing, and connector health.",
  };

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK: ItsmConnectorsBuyerJiraServicenowLink =
  {
    id: "jira",
    label: "Jira",
    href: INTEGRATIONS_JIRA_PATH,
    whenToUse: "Open buyer product integration setup for Jira.",
  };

export const ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK: ItsmConnectorsBuyerJiraServicenowLink =
  {
    id: "servicenow",
    label: "ServiceNow",
    href: INTEGRATIONS_SERVICENOW_PATH,
    whenToUse: "Open buyer product integration setup for ServiceNow.",
  };

const ALL_LINKS: readonly ItsmConnectorsBuyerJiraServicenowLink[] = [
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
  ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
];

/** Full vocabulary model. */
export function buildItsmConnectorsBuyerJiraServicenowVocabulary(): ItsmConnectorsBuyerJiraServicenowVocabularyModel {
  return {
    heading: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_HEADING,
    whyThree: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_WHY_THREE,
    compactLine: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_COMPACT_LINE,
    itsmConnectorsLink: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_CONNECTORS_LINK,
    jiraLink: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_JIRA_LINK,
    serviceNowLink: ITSM_CONNECTORS_BUYER_JIRA_SERVICENOW_SERVICENOW_LINK,
  };
}

/** Resolve the link for the current surface. */
export function resolveItsmConnectorsBuyerJiraServicenowLink(
  surfaceId: ItsmConnectorsBuyerJiraServicenowSurfaceId,
): ItsmConnectorsBuyerJiraServicenowLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer links for the surfaces you are not on. */
export function resolveItsmConnectorsBuyerJiraServicenowPeerLinks(
  currentSurfaceId: ItsmConnectorsBuyerJiraServicenowSurfaceId,
): readonly ItsmConnectorsBuyerJiraServicenowLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
