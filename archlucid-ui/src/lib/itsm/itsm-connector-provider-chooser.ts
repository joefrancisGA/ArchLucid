/**
 * TB-2256 — Jira ≠ ServiceNow ≠ Azure Boards connector chooser rail.
 *
 * Why three connector surfaces exist:
 * - Jira (`/integrations/jira`) configures Atlassian Jira outbound ticketing.
 * - ServiceNow (`/integrations/servicenow`) configures ServiceNow CMDB / incident
 *   outbound ticketing.
 * - Azure Boards (`/integrations/azure-boards`) configures Azure DevOps Boards
 *   work-item outbound ticketing.
 *
 * They stay separate because each product has its own credentials, projects,
 * and routing. Configuring one connector does not configure the others.
 * Distinct from TB-2236 (create-ticket / disposition / inbound-queue triad on a finding).
 */

import {
  INTEGRATIONS_AZURE_BOARDS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";

export type ItsmConnectorProviderId = "jira" | "servicenow" | "azure-boards";

export type ItsmConnectorProviderLink = {
  readonly id: ItsmConnectorProviderId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ItsmConnectorProviderChooserModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly jiraLink: ItsmConnectorProviderLink;
  readonly serviceNowLink: ItsmConnectorProviderLink;
  readonly azureBoardsLink: ItsmConnectorProviderLink;
  readonly providers: readonly ItsmConnectorProviderLink[];
};

export const ITSM_CONNECTOR_PROVIDER_HEADING =
  "Jira, ServiceNow, and Azure Boards are different connectors" as const;

export const ITSM_CONNECTOR_PROVIDER_WHY_THREE =
  "Jira configures Atlassian issue destinations. ServiceNow configures CMDB and incident destinations. Azure Boards configures Azure DevOps work-item destinations. Each connector has its own credentials and routing — setting up one product does not configure the others." as const;

export const ITSM_CONNECTOR_PROVIDER_COMPACT_LINE =
  "Pick the ITSM product your workspace uses — Jira, ServiceNow, and Azure Boards stay separate connectors." as const;

export const ITSM_CONNECTOR_PROVIDER_JIRA_LINK: ItsmConnectorProviderLink = {
  id: "jira",
  label: "Jira",
  href: INTEGRATIONS_JIRA_PATH,
  whenToUse: "Configure Atlassian Jira outbound issue creation and routing.",
};

export const ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK: ItsmConnectorProviderLink = {
  id: "servicenow",
  label: "ServiceNow",
  href: INTEGRATIONS_SERVICENOW_PATH,
  whenToUse: "Configure ServiceNow incident and CMDB outbound ticketing.",
};

export const ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK: ItsmConnectorProviderLink = {
  id: "azure-boards",
  label: "Azure Boards",
  href: INTEGRATIONS_AZURE_BOARDS_PATH,
  whenToUse: "Configure Azure DevOps Boards work-item outbound ticketing.",
};

export const ITSM_CONNECTOR_PROVIDER_LINKS: readonly ItsmConnectorProviderLink[] = [
  ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
  ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
  ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
] as const;

/** Full chooser model (heading, why-three, and three provider links). */
export function buildItsmConnectorProviderChooser(): ItsmConnectorProviderChooserModel {
  return {
    heading: ITSM_CONNECTOR_PROVIDER_HEADING,
    whyThree: ITSM_CONNECTOR_PROVIDER_WHY_THREE,
    compactLine: ITSM_CONNECTOR_PROVIDER_COMPACT_LINE,
    jiraLink: ITSM_CONNECTOR_PROVIDER_JIRA_LINK,
    serviceNowLink: ITSM_CONNECTOR_PROVIDER_SERVICENOW_LINK,
    azureBoardsLink: ITSM_CONNECTOR_PROVIDER_AZURE_BOARDS_LINK,
    providers: ITSM_CONNECTOR_PROVIDER_LINKS,
  };
}

/** Peer provider deep-links for the surfaces you are not currently on. */
export function resolveItsmConnectorProviderPeerLinks(
  currentProviderId: ItsmConnectorProviderId,
): readonly ItsmConnectorProviderLink[] {
  return ITSM_CONNECTOR_PROVIDER_LINKS.filter((link) => link.id !== currentProviderId);
}

/** Current provider link for aria-current labeling. */
export function resolveItsmConnectorProviderCurrentLink(
  currentProviderId: ItsmConnectorProviderId,
): ItsmConnectorProviderLink {
  const match = ITSM_CONNECTOR_PROVIDER_LINKS.find((link) => link.id === currentProviderId);

  if (match === undefined) {
    return ITSM_CONNECTOR_PROVIDER_JIRA_LINK;
  }

  return match;
}
