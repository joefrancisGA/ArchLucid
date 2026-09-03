
/** Integrations and cloud-connection help-topic traffic rows. */

import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

export const HELP_TOPIC_TRAFFIC_ROWS_INTEGRATIONS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Cloud connections help topic. Owner backlog shorthand: HCE. */
  {
    rowId: "HCE",
    path: "/help/cloud-connections",
    section: "Help topic",
    note: "Cloud connections help (Help topic) - HelpCloudConnectionsGuideView with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), Learn more / claim-discipline orientation (Sources follow-up removed TB-2092), hub/Azure CTAs, curated CLOUD_CONNECTIONS.md body. Orientation guide - not a signed-record Sources trail. Sibling HC = Azure secure-connect alias. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpCloudConnectionsGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Azure permissions help. Owner backlog shorthand: HE (template formerly HAZ at lower Hit%). */
  {
    rowId: "HE",
    path: "/help/azure-permissions",
    section: "Help topic",
    note: "Azure permissions help (Help topic) - HelpAzurePermissionsGuideView with PageContextualHelpButton (topic map azure-permissions; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, permissions matrix, setup and verify panels. Not bare HelpTopicMarkdownView. Sibling HC = Connect Azure securely; HCE = cloud-connections help. Score 58/100 (2026-08-04) Ã¢â‚¬â€ help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["HelpAzurePermissionsGuideView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Integration readiness help. Owner backlog shorthand: HEI. */
  {
    rowId: "HEI",
    path: "/help/integration-readiness",
    section: "Help topic",
    note: "Integration readiness help (Help topic) - HelpTopicMarkdownView with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Connection status header primary action, claim-discipline orientation strip + diligence artifact index, curated INTEGRATION_READINESS.md. Sibling IJX/ISX/INA = live ITSM settings; ACS = connection-status; HEZ = azure-boards help. Not bare HelpTopicMarkdownView without orientation. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Azure Boards help. Owner backlog shorthand: HEZ. */
  {
    rowId: "HEZ",
    path: "/help/azure-boards",
    section: "Help topic",
    note: "Specialty Azure Boards help - HelpAzureBoardsGuideView with PageContextualHelpButton first in header (topic map azure-boards; Category-1 registry), h1 title, document StatusTag, HelpTopicRegistryProvenanceLine, PAT warn callout, authority prerequisite line, live connection StatusTag via HelpAzureBoardsConnectionContext (or honest absent copy), curated AZURE_BOARDS_INTEGRATION.md body. Absorbs retired integrations/azure-boards bookmark. Sibling INZ = live Azure Boards settings; HEI = integration-readiness. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.",
    noteMustContain: ["Score 58", "cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Connection status help. Owner backlog shorthand: HCO. */
  {
    rowId: "HCO",
    path: "/help/connection-status",
    section: "Help topic",
    note: "Connection status help (Help topic) - HelpConnectionStatusGuideView with PageContextualHelpButton (topic map connection-status; Category-1 registry), connection readiness orientation strip, integration readiness CTAs. Sibling ADC = /administration/connection-status; HEI = integration-readiness. Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-08) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["HelpConnectionStatusGuideView", "Score 58", "cannot improve further toward 80"],
  },
];
