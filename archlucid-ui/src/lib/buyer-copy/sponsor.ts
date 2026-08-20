/**
 * Sponsor dashboard, scorecard, and sponsor value report copy.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

/** Help guide step 1 — sponsor-first walkthrough (distinct from home hero CTA). */
export const BUYER_HELP_SPONSOR_STEP_CTA = "Open sponsor report";

export const BUYER_WHY_ARCHLUCID_SOURCES_LINE =
  "Aggregated sponsor-facing proof from measured ROI, sponsor evidence pack, value report, and aggregate explanation services.";

/** Default matches Retail baseline seed wired by `/why-archlucid` (TB-1306 Contoso-labeled-live). */
export const BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE =
  "Aggregated proof from the evidence pack service — paired with the example Retail baseline review below.";

/**
 * Canonical title for the merged sponsor report at `/insights/sponsor-report` — the standalone
 * pilot outcomes page folded into it, so one page now carries the period report and its exports.
 */
export const SPONSOR_REPORT_PAGE_TITLE = "Sponsor report";

export const BUYER_VALUE_REPORT_PAGE_SUBTITLE =
  "Generate export-ready summaries of finalized reviews, findings, governance activity, and estimated ROI.";

export const BUYER_VALUE_REPORT_OUTCOME_LEAD =
  "Choose a reporting period, review what the report contains, and export when finalized reviews exist in that window.";

export const BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE = "How the sponsor report works";

export const BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS =
  "The sponsor report aggregates finalized reviews, governance activity, and ROI estimates for the selected UTC period. Exports unlock after at least one finalized review falls in the window. Use ROI summary or Review scorecard for deeper drill-downs.";

export const BUYER_VALUE_REPORT_PERIOD_UTC_HELP = "Times are in UTC for consistent reporting.";

export const BUYER_VALUE_REPORT_PERIOD_EXPORTS_TITLE = "Report period and exports";

export const BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP =
  "Exports are available after at least one finalized review exists in this period.";

export const BUYER_VALUE_REPORT_INCLUDES_TITLE = "Sponsor report includes";

export const BUYER_VALUE_REPORT_INCLUDES_ITEMS = [
  "Finalized reviews",
  "Key findings",
  "Governance activity",
  "Decision summary",
  "ROI estimate",
  "Recommended next actions",
] as const;

export const BUYER_VALUE_REPORT_EMPTY_TITLE = "No finalized reviews in this report period";

export const BUYER_VALUE_REPORT_EMPTY_DESCRIPTION =
  "Finalize at least one review in the selected period to generate a sponsor value report.";

export const BUYER_VIEW_SAMPLE_VALUE_REPORT_CTA = "View sample value report";

export const BUYER_VALUE_REPORT_DEMO_SAMPLE_NOTE = "Demo workspace: Sample report output is available.";

export const BUYER_VALUE_REPORT_PREVIEW_TITLE = "Report preview";

export const BUYER_SPONSOR_DATA_SOURCE_NOTE = "Source: finalized reviews in this workspace.";

export const BUYER_SPONSOR_SUMMARY_LOAD_ERROR =
  "We couldn't load the sponsor report. Try again or contact support with the reference below.";

export const BUYER_SPONSOR_SCORECARD_WINDOW_HELP = "Showing the selected time range.";

export const BUYER_SPONSOR_COMPLIANCE_DRIFT_TREND_DESCRIPTION =
  "Daily trend of findings opened when reviews capture snapshots versus findings resolved through governance review.";

export const BUYER_SPONSOR_ENVIRONMENT_SAVINGS_DESCRIPTION =
  "Estimated savings grouped by environment tag from finalized reviews in this workspace.";

export const BUYER_SPONSOR_SCORECARD_DRIFT_TREND_INSUFFICIENT =
  "Not enough data in this range yet.";

export const BUYER_SPONSOR_SCORECARD_NO_ACTIONS_HEALTHY =
  "No actions needed for the current period.";

export const BUYER_SPONSOR_SCORECARD_NO_ACTIONS_NOT_READY =
  "No actions yet. Finalize a review to generate scorecard signals.";

export const BUYER_SPONSOR_SCORECARD_LINK_REVIEW_PACKAGES = "Open reviews";

export const BUYER_SPONSOR_SCORECARD_RECOMMENDED_ACTION_LINK = "Review this action →";

export const BUYER_SPONSOR_OPERATOR_HANDOFF_LINK = "Open in Operator →";

export const BUYER_SPONSOR_SCORECARD_COMMITTED_LABEL = "Finalized reviews";
