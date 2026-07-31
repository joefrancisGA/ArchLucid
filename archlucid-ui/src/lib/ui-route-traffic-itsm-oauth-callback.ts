import { ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH } from "@/lib/integrations-nav-paths";

/** Traffic workbook row ID for the Atlassian ITSM OAuth consent return surface. */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID = "IIO";

/** Canonical path tracked on the IIO workbook row (must match integrations nav constant). */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_PATH = ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH;

/**
 * Owner workbook Notes for IIO — documents that TB-1776 carved this path out of the
 * legacy ITSM hub redirect so Atlassian OAuth returns land on a live App Router page.
 */
export const ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE =
  "Atlassian OAuth consent return — live App Router page; not redirect-blocked (TB-1776 hub carve-out). Score UX after TB-1782+.";
