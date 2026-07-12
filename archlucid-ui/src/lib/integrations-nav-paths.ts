import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical integration readiness hub URL (TB-408 / TB-750). */
export const INTEGRATIONS_READINESS_PATH = "/integrations/readiness";

/** Legacy browser path — permanent redirect to {@link INTEGRATIONS_READINESS_PATH} (TB-408). */
export const LEGACY_INTEGRATIONS_OPERATIONS_PATH = "/integrations/operations";

/** Legacy combined operator route — redirects to Integration readiness; use Jira/ServiceNow paths instead. */
export const LEGACY_INTEGRATIONS_ITSM_PATH = "/integrations/itsm";

export const INTEGRATIONS_JIRA_PATH = "/integrations/jira";

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
