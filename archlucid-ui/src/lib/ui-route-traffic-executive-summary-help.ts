import { EXECUTIVE_SUMMARY_HELP_PATH } from "@/lib/executive-summary-help-route";
import { SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

/**
 * Traffic workbook row ID for Executive summary help.
 * Owner backlog shorthand: EXE.
 */
export const EXECUTIVE_SUMMARY_HELP_TRAFFIC_ROW_ID = "EXE";

/** Canonical path tracked on the EXE workbook row. */
export const EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH = EXECUTIVE_SUMMARY_HELP_PATH;

/** Workbook Section column value - in-app help topic, not marketing. */
export const EXECUTIVE_SUMMARY_HELP_TRAFFIC_SECTION = "Help topic";

/**
 * Owner workbook Notes for EXE - documents the specialty HelpExecutiveSummaryGuideView surface.
 */
export const EXECUTIVE_SUMMARY_HELP_TRAFFIC_NOTE =
  "Specialty sponsor ROI guide - HelpExecutiveSummaryGuideView on EXECUTIVE_SPONSOR_BRIEF sponsor sections with CTAs to /sponsor-report/executive-summary (SPE) and executive dashboard. Not bare FAQ HelpTopicMarkdownView.";

/** Live sponsor value report path referenced from EXE handoffs (workbook row SPE). */
export const EXECUTIVE_SUMMARY_HELP_SPONSOR_REPORT_PATH = SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH;
