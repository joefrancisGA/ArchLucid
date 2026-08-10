import { CONFIGURATION_REFERENCE_HELP_PATH } from "@/lib/configuration-reference-help-route";

/**
 * Traffic workbook row ID for Configuration reference help.
 * Owner backlog shorthand: CON.
 */
export const CONFIGURATION_REFERENCE_HELP_TRAFFIC_ROW_ID = "CON";

/** Canonical path tracked on the CON workbook row. */
export const CONFIGURATION_REFERENCE_HELP_TRAFFIC_PATH = CONFIGURATION_REFERENCE_HELP_PATH;

/** Workbook Section column value — Internal admin runbook; excluded from buyer UX scoring. */
export const CONFIGURATION_REFERENCE_HELP_TRAFFIC_SECTION = "Internal";

/**
 * Owner workbook Notes for CON — documents the specialty Admin configuration guide surface.
 */
export const CONFIGURATION_REFERENCE_HELP_TRAFFIC_NOTE =
  "Specialty configuration reference (Admin internal-runbook) - HelpConfigurationReferenceGuideView with SSO wizard / identity-providers / API-keys / configuration-summary primary CTAs, Sources strip (authentication-sign-in, users-and-roles, enterprise-onboarding, cloud-connections, security-trust, data-handling), task sections, claim-discipline callout, PageContextualHelp, collapsed Admin key-catalog appendix, and prepared CONFIGURATION_REFERENCE.md (TB-1327 leakage strip + TB-1330 in-app-only links). Not bare HelpTopicMarkdownView. Admin-gated until catalog remains eng appendix (TB-1329 option b). Score 62/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
