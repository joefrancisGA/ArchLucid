import { DEVELOPER_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";

/**
 * Traffic workbook row ID for Engineering troubleshooting runbook help.
 * Owner backlog shorthand: HDX.
 */
export const DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_ROW_ID = "HDX";

/** Canonical path tracked on the HDX workbook row. */
export const DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_PATH = DEVELOPER_TROUBLESHOOTING_HELP_PATH;

/** Workbook Section column value â€” in-app help, not marketing. */
export const DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for HDX â€” documents the Admin-gated internal-runbook surface.
 */
export const DEVELOPER_TROUBLESHOOTING_HELP_TRAFFIC_NOTE =
 "Specialty engineering troubleshooting runbook (Admin internal-runbook, TB-1246) - HelpEngineeringTroubleshootingGuideView with Customer Troubleshooting / System health / Report a problem / CLI primary CTAs, Sources diligence strip (admin-diagnostics, configuration-reference), claim-discipline callout, PageContextualHelp, HelpTopicAuthorityGate + HelpTopicMarkdownClient specialty branch, and prepared TROUBLESHOOTING.md + COMMON_ERRORS.md (contributor ADR/TB link strip). Help search Advanced diagnostics (adminOnly). Not in customer Help Center featured grid. Customer Troubleshooting (HTX) does not deep-link here (TB-1249). Slug remains developer-troubleshooting pending TB-1248 rename. Score 56/100 (2026-08-08) - surface hard-caps higher Evidence. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
