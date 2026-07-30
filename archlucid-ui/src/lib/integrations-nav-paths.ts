import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical integration readiness hub URL (TB-408 / TB-750). */
export const INTEGRATIONS_READINESS_PATH = "/integrations/readiness";

/** Legacy browser path — permanent redirect to {@link INTEGRATIONS_READINESS_PATH} (TB-408). */
export const LEGACY_INTEGRATIONS_OPERATIONS_PATH = "/integrations/operations";

/** Legacy combined operator route — hub redirects to Integration readiness; OAuth callback stays reachable (TB-1776). */
export const LEGACY_INTEGRATIONS_ITSM_PATH = "/integrations/itsm";

/** Atlassian OAuth return URL — must not be covered by the ITSM hub readiness redirect (TB-1776 / TB-600). */
export const ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH = "/integrations/itsm/oauth/callback";

export const INTEGRATIONS_JIRA_PATH = "/integrations/jira";

export const INTEGRATIONS_AZURE_BOARDS_PATH = "/integrations/azure-boards";

export const INTEGRATIONS_SERVICENOW_PATH = "/integrations/servicenow";

export const INTEGRATIONS_TEAMS_PATH = "/integrations/teams";

export const INTEGRATIONS_SLACK_PATH = "/integrations/slack";

export const INTEGRATIONS_WEBHOOKS_PATH = "/integrations/webhooks";

/** Canonical Tier 2 cloud connection UI (TB-407). */
export const CLOUD_CONNECTIONS_PATH = "/integrations/cloud-connections";

/** Legacy settings URL — permanent redirect to canonical (TB-407). */
export const LEGACY_CLOUD_CONNECTIONS_PATH = "/settings/cloud-connections";

export function pathMatchesCloudConnections(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, CLOUD_CONNECTIONS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_CLOUD_CONNECTIONS_PATH)
  );
}

export function pathMatchesIntegrationsReadiness(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, INTEGRATIONS_READINESS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_INTEGRATIONS_OPERATIONS_PATH)
    || pathMatchesRoutePrefix(pathname, LEGACY_INTEGRATIONS_ITSM_PATH)
  );
}
