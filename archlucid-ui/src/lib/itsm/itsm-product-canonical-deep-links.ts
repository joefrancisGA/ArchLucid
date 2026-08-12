/** Canonical ITSM product deep-links — not the removed combined hub (TB-1780). */
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
  REMOVED_INTEGRATIONS_ITSM_HUB_PATH,
} from "@/lib/integrations-nav-paths";
import { INTERNAL_ITSM_CONNECTORS_PATH } from "@/lib/internal-ops-route-paths";

export const ITSM_PRODUCT_CANONICAL_DEEP_LINKS = {
  readiness: INTEGRATIONS_READINESS_PATH,
  jira: INTEGRATIONS_JIRA_PATH,
  serviceNow: INTEGRATIONS_SERVICENOW_PATH,
  adminConnectors: INTERNAL_ITSM_CONNECTORS_PATH,
  oauthCallback: ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
} as const;

export const ITSM_REMOVED_PRODUCT_HUB_PATH = REMOVED_INTEGRATIONS_ITSM_HUB_PATH;

/** Product UI must not deep-link to the removed hub except OAuth callback routes. */
export const ITSM_PRODUCT_HUB_HREF_BANNED_PATTERNS: readonly string[] = [
  `href="${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}"`,
  `href='${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}'`,
  `"${REMOVED_INTEGRATIONS_ITSM_HUB_PATH}"`,
] as const;
