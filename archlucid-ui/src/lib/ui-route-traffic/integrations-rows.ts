import { CLOUD_CONNECTIONS_PATH, ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH } from "@/lib/integrations-nav-paths";
import type { UiRouteTrafficRow } from "@/lib/ui-route-traffic/types";

/** Traffic workbook rows for the `integrations` workbook section. */
export const INTEGRATIONS_TRAFFIC_ROWS: readonly UiRouteTrafficRow[] = [
  /** Traffic workbook row ID for Azure cloud connection settings. Owner backlog shorthand: IAZ. */
  {
    rowId: "IAZ",
    path: "/integrations/cloud-connections/azure",
    section: "Integrations",
    note: "Azure cloud connection (Integrations) - AzureCloudConnectionDetailClient with CloudConnectionsProviderHeader PageContextualHelpButton (topic map cloud-connections-azure; Category-1 registry), security preflight + service-principal federation + Tier2 wizard. Sibling SCE = cloud-connections hub; INC = AWS; IGC = GCP; HC = connect-azure help. Read-only connector config Ã¢â‚¬â€ not a signed-record Sources trail.integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for GCP cloud connection settings. Owner backlog shorthand: IGC. */
  {
    rowId: "IGC",
    path: "/integrations/cloud-connections/gcp",
    section: "Integrations",
    note: "GCP cloud connection (Integrations) - GcpCloudConnectionDetailClient with CloudConnectionsProviderHeader PageContextualHelpButton (topic map cloud-connections-gcp; Category-1 registry), security preflight + Workload Identity Federation + connection details. Sibling SCE = cloud-connections hub; INC = AWS; IAZ = Azure; HGC = connect-gcp help. Read-only connector config Ã¢â‚¬â€ not a signed-record Sources trail.integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for the Atlassian ITSM OAuth consent return surface. */
  {
    rowId: "IIO",
    path: ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
    section: "Integrations",
    note: "Atlassian OAuth consent return (Integrations) - ItsmAtlassianOAuthCallbackClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, consent status + return to Jira settings. Live App Router page; not redirect-blocked (TB-1776 hub carve-out). Score 40/100 (2026-08-05) â€” OAuth handshake surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ItsmAtlassianOAuthCallbackClient", "Sources"],
    noteMustNotContainLower: ["blocked-by-redirect", "blocked by redirect"],
  },
  /** Traffic workbook row ID for Jira integration. Owner backlog shorthand: IJX. */
  {
    rowId: "IJX",
    path: "/integrations/jira",
    section: "Integrations",
    note: "Jira integration (Integrations) - ItsmProductIntegrationPageClient (product=jira) with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), health probe, tenant outbound overrides. Outbound ITSM config hub - not a signed-record Sources trail. Sibling ISX = ServiceNow; INA = Azure Boards; SCE = cloud connections. Score 68/100 (2026-08-08) - integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ItsmProductIntegrationPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for AWS cloud connection settings. Owner backlog shorthand: INC. */
  {
    rowId: "INC",
    path: "/integrations/cloud-connections/aws",
    section: "Integrations",
    note: "AWS cloud connection (Integrations) - AwsCloudConnectionDetailClient with CloudConnectionsProviderHeader PageContextualHelpButton (topic map cloud-connections-aws; Category-1 registry), security preflight + IAM role federation + connection details. Sibling SCE = cloud-connections hub; IAZ = Azure; IGC = GCP; HEC = connect-aws help. Read-only connector config Ã¢â‚¬â€ not a signed-record Sources trail.integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Azure Boards integration settings. Owner backlog shorthand: INZ. */
  {
    rowId: "INZ",
    path: "/integrations/azure-boards",
    section: "Integrations",
    note: "Azure Boards integration (Integrations) - AzureBoardsIntegrationPageClient with OperatorPageHeader PageContextualHelpButton (topic map azure-boards; Category-1 registry), connection settings + health probe + default work-item behavior. Outbound ITSM config hub Ã¢â‚¬â€ not a signed-record Sources trail. Sibling IJX = Jira; ISX = ServiceNow; HEZ = azure-boards help; ACS = connection-status.integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["cannot improve further toward 80"],
    noteMustMatch: [/TB-2092|PageContextualHelp|Learn more|claim-discipline/i],
  },
  /** Traffic workbook row ID for Slack integration. Owner backlog shorthand: ISN. */
  {
    rowId: "ISN",
    path: "/integrations/slack",
    section: "Integrations",
    note: "Slack integration (Integrations) - SlackIntegrationPageClient with PageContextualHelpButton (topic map alerts; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), destination form + destinations panel. Notification routing config hub - not a signed-record Sources trail. Sibling ITX = Teams; SAX/GOR = alert rules. Score 68/100 (2026-08-08) - integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["SlackIntegrationPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for ServiceNow integration. Owner backlog shorthand: ISX. */
  {
    rowId: "ISX",
    path: "/integrations/servicenow",
    section: "Integrations",
    note: "ServiceNow integration (Integrations) - ServiceNowIntegrationPageClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), connection status, CMDB incident overrides. Outbound ITSM config hub - not a signed-record Sources trail. Sibling IJX = Jira; INA = Azure Boards; SCE = cloud connections. Score 68/100 (2026-08-08) - integration-config hub integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["ServiceNowIntegrationPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Teams integration. Owner backlog shorthand: ITX. */
  {
    rowId: "ITX",
    path: "/integrations/teams",
    section: "Integrations",
    note: "Teams integration (Integrations) - TeamsNotificationsIntegrationPageView with PageContextualHelpButton (topic map alerts; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), connector form + notification selector. Notification routing config hub - not a signed-record Sources trail. Sibling ISN = Slack; SAX/GOR = alert rules. Score 68/100 (2026-08-08) - integration-config hub at SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["TeamsNotificationsIntegrationPageView", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Webhooks integration. Owner backlog shorthand: IWX. */
  {
    rowId: "IWX",
    path: "/integrations/webhooks",
    section: "Integrations",
    note: "Webhooks integration (Integrations) - WebhooksIntegrationPageClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), endpoint list + delivery history. Sibling IJX = Jira; ISX = ServiceNow; OID = DLQ; ADY = system-health. Outbound webhook config - not a signed-record Sources trail. Score 58/100 (2026-08-08) - connector config connector config ceiling below SCE Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["WebhooksIntegrationPageClient", "Sources", "cannot improve further toward 80"],
  },
  /** Traffic workbook row ID for Cloud connections landing. Owner backlog shorthand: SCE. */
  {
    rowId: "SCE",
    path: CLOUD_CONNECTIONS_PATH,
    section: "Integrations",
    note: "Cloud connections (Integrations) - landing hub with PageContextualHelpButton (topic map cloud-connections; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, platform scope panel, provider summary cards + evidence-only upload. Canonical path /integrations/cloud-connections (legacy /settings/cloud-connections maps via orientation only). Not a signed-record Sources trail by itself. Score 68/100 (2026-08-08) - integrations launcher at ADY readiness Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.",
    noteMustContain: ["PageContextualHelpButton", "Sources", "Score 68", "cannot improve further toward 80"],
    sectionMustNotEqualLower: ["marketing"],
  },
];
