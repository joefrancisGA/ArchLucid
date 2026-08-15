import { SPONSOR_SUMMARY_HELP_PATH } from "@/lib/sponsor/sponsor-report-help-route";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/**
 * Traffic workbook row ID for Sponsor report help.
 * Owner backlog shorthand: EXE.
 */
export const SPONSOR_SUMMARY_HELP_TRAFFIC_ROW_ID = "EXE";

/** Canonical path tracked on the EXE workbook row. */
export const SPONSOR_SUMMARY_HELP_TRAFFIC_PATH = SPONSOR_SUMMARY_HELP_PATH;

/** Workbook Section column value - in-app help topic, not marketing. */
export const SPONSOR_SUMMARY_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for EXE - documents specialty HelpSponsorReportGuideView Evidence chrome.
 * ASCII-only for Windows console note scripts.
 */
export const SPONSOR_SUMMARY_HELP_TRAFFIC_NOTE =
  "Sponsor report help (Help topic) - HelpSponsorReportGuideView with PageContextualHelpButton (topic map sponsor-report; Category-1 registry), Learn more / claim-discipline (Sources follow-up removed TB-2092) orientation strip, sponsor value-report / sponsor-dashboard / pilot-roi CTAs, prepared SPONSOR_SPONSOR_BRIEF.md (overview + pilot). Absorbs former product-overview twin (TB-1739). Not bare HelpTopicMarkdownView. Score 58/100 (2026-08-07) - help-topic ceiling below HEL hub band; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.";

/** Live sponsor value report path referenced from EXE handoffs (workbook row SPE). */
export const SPONSOR_SUMMARY_HELP_SPONSOR_REPORT_PATH = SPONSOR_REPORT_PATH;
