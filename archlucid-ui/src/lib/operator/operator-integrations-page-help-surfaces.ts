/**
 * TB-1669 — Integration + extended-nav hubs that must mount `PageContextualHelpButton` with topic map rows.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator page contextual help* (**TB-1666**).
 */

export type OperatorIntegrationsPageHelpSurfaceEntry = {
  readonly id: string;
  readonly pathname: string;
  readonly modulePath: string;
  readonly notes: string;
};

/** Surfaces named in **TB-1669** (integration readiness slice shipped earlier; remainder closed 2026-08-12). */
export const OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES: readonly OperatorIntegrationsPageHelpSurfaceEntry[] =
  [
    {
      id: "integrations-cloud-connections",
      pathname: "/integrations/cloud-connections",
      modulePath: "app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageClient.tsx",
      notes: "Cloud connections hub — cloud-connections help topic.",
    },
    {
      id: "integrations-cloud-connections-azure",
      pathname: "/integrations/cloud-connections/azure",
      modulePath: "app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsProviderHeader.tsx",
      notes: "Azure cloud connection detail — azure-permissions help topic.",
    },
    {
      id: "integrations-cloud-connections-aws",
      pathname: "/integrations/cloud-connections/aws",
      modulePath: "app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsProviderHeader.tsx",
      notes: "AWS cloud connection detail — cloud-connections-aws help topic.",
    },
    {
      id: "integrations-cloud-connections-gcp",
      pathname: "/integrations/cloud-connections/gcp",
      modulePath: "app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsProviderHeader.tsx",
      notes: "GCP cloud connection detail — cloud-connections-gcp help topic.",
    },
    {
      id: "integrations-jira",
      pathname: "/integrations/jira",
      modulePath: "app/(operator)/integrations/jira/_sections/JiraIntegrationPageHeader.tsx",
      notes: "Jira integration — integration-readiness help topic.",
    },
    {
      id: "integrations-servicenow",
      pathname: "/integrations/servicenow",
      modulePath: "app/(operator)/integrations/servicenow/_sections/ServiceNowIntegrationPageHeader.tsx",
      notes: "ServiceNow integration — integration-readiness help topic.",
    },
    {
      id: "integrations-azure-boards",
      pathname: "/integrations/azure-boards",
      modulePath: "app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageHeader.tsx",
      notes: "Azure Boards integration — azure-boards help topic.",
    },
    {
      id: "integrations-teams",
      pathname: "/integrations/teams",
      modulePath: "app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
      notes: "Microsoft Teams notifications — teams-integration specialty help topic.",
    },
    {
      id: "integrations-slack",
      pathname: "/integrations/slack",
      modulePath: "app/(operator)/integrations/slack/_sections/SlackIntegrationPageHeader.tsx",
      notes: "Slack notifications — slack-integration specialty help topic.",
    },
    {
      id: "integrations-webhooks",
      pathname: "/integrations/webhooks",
      modulePath: "app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx",
      notes: "Outbound webhooks — webhooks-integration specialty help topic.",
    },
    {
      id: "integrations-atlassian-oauth-callback",
      pathname: "/integrations/itsm/oauth/callback",
      modulePath: "app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient.tsx",
      notes: "Atlassian OAuth return — integration-readiness help topic.",
    },
    {
      id: "administration-connection-status",
      pathname: "/administration/connection-status",
      modulePath: "app/(operator)/administration/connection-status/page.tsx",
      notes: "Connection status / integration readiness hub — integration-readiness help topic.",
    },
    {
      id: "internal-product-learning",
      pathname: "/internal/product-learning",
      modulePath: "app/(operator)/internal/product-learning/_sections/ProductLearningPageView.tsx",
      notes: "Pilot feedback dashboard — pilot-feedback help topic.",
    },
    {
      id: "insights-patterns",
      pathname: "/insights/patterns",
      modulePath: "app/(operator)/insights/patterns/_sections/PatternLibraryPageClient.tsx",
      notes: "Pattern library hub — repeat-review-loop help topic; detail inherits via prefix match (TB-1814).",
    },
    {
      id: "insights-patterns-detail",
      pathname: "/insights/patterns/api-gateway-bff",
      modulePath: "app/(operator)/insights/patterns/_sections/PatternLibraryDetailClient.tsx",
      notes: "Pattern detail inherits pattern-library hub topic via prefix match.",
    },
    {
      id: "internal-health",
      pathname: "/internal/health",
      modulePath: "app/(operator)/internal/health/_sections/AdminHealthPageView.tsx",
      notes: "Diagnostics dashboard — admin-diagnostics help topic.",
    },
  ];
