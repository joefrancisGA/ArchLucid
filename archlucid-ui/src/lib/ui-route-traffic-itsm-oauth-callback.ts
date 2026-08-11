import { ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH } from "@/lib/integrations-nav-paths";

/** Traffic workbook row ID for the Atlassian ITSM OAuth consent return surface. */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID = "IIO";

/** Canonical path tracked on the IIO workbook row (must match integrations nav constant). */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_PATH = ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH;

/** Workbook Section column value (template catalog). */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_SECTION = "Integrations";

/**
 * Owner workbook Notes for IIO â€” documents Evidence chrome on the Atlassian OAuth callback.
 */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE =
  "Atlassian OAuth consent return (Integrations) - ItsmAtlassianOAuthCallbackClient with PageContextualHelpButton (topic map integration-readiness; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, consent status + return to Jira settings. Live App Router page; not redirect-blocked (TB-1776 hub carve-out). Score 40/100 (2026-08-05) â€” OAuth handshake surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
