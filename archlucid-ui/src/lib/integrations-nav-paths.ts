import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical Administration → Connection status hub (nav label alignment). */
export const ADMINISTRATION_CONNECTION_STATUS_PATH = "/administration/connection-status";

/** @deprecated Prefer {@link ADMINISTRATION_CONNECTION_STATUS_PATH}. */
export const INTEGRATIONS_READINESS_PATH = ADMINISTRATION_CONNECTION_STATUS_PATH;

/**
 * Former combined ITSM hub — removed pre-release (no redirect).
 * Product surfaces use Jira/ServiceNow pages; OAuth callback remains below.
 */
export const REMOVED_INTEGRATIONS_ITSM_HUB_PATH = "/integrations/itsm";

/** @deprecated Prefer {@link REMOVED_INTEGRATIONS_ITSM_HUB_PATH}. */
export const LEGACY_INTEGRATIONS_ITSM_PATH = REMOVED_INTEGRATIONS_ITSM_HUB_PATH;

/** Atlassian OAuth return URL — live App Router page under the former hub segment. */
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
  return pathMatchesRoutePrefix(pathname, ADMINISTRATION_CONNECTION_STATUS_PATH);
}
