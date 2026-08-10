import { SETTINGS_ACCOUNT_SECURITY_PATH } from "@/lib/settings-admin-route-paths";

/**
 * Traffic workbook row ID for Account security settings.
 * Owner backlog shorthand: ADS (template formerly SEA; template advisory-scans tab ADS renamed ADT).
 */
export const ACCOUNT_SECURITY_SETTINGS_TRAFFIC_ROW_ID = "ADS";

/** Canonical path tracked on the ADS workbook row. */
export const ACCOUNT_SECURITY_SETTINGS_TRAFFIC_PATH = SETTINGS_ACCOUNT_SECURITY_PATH;

/** Workbook Section column value (template catalog). */
export const ACCOUNT_SECURITY_SETTINGS_TRAFFIC_SECTION = "Admin";

/**
 * Owner workbook Notes for ADS - documents Evidence chrome on Account security.
 * ASCII-only for Windows console note scripts.
 */
export const ACCOUNT_SECURITY_SETTINGS_TRAFFIC_NOTE =
  "Account security (Settings) - AccountSecurityPageClient with PageContextualHelpButton (topic map security-trust; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, sign-in methods / link flows. Sibling ADR = preferences; WSX = security-trust settings; HSE = security-trust help. Personal sign-in controls - not a signed-record Sources trail.admin hub at SET/ADY Evidence band; hard-caps higher Evidence without signed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
