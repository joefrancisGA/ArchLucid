export const AUDIT_TRAIL_PAGE_TITLE = "Audit trail" as const;

export const AUDIT_TRAIL_PAGE_SUBTITLE =
  "Review finalized activity, approvals, decisions, evidence changes, and export events for this review." as const;

export const AUDIT_TRAIL_PAGE_SUBTITLE_BUYER =
  "See who acted, when, and why for finalized review activity in this workspace." as const;

export const AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR =
  "Search and filter audit events for this workspace; CSV export requires Auditor or Admin access." as const;

export function auditTrailPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AUDIT_TRAIL_PAGE_SUBTITLE_BUYER : AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR;
}

export const AUDIT_TRAIL_LAST_UPDATED_PREFIX = "Last refreshed" as const;

export const AUDIT_TRAIL_PRODUCT_SAFE_INTRO =
  "See who acted, when, and why for finalized review activity in this workspace." as const;

export const AUDIT_TRAIL_HOW_IT_WORKS_TITLE = "How audit trails work" as const;

export const AUDIT_TRAIL_HOW_IT_WORKS_BODY =
  "Append-only audit events record creates, finalizations, governance decisions, and exports with actor, action type, and timestamp. Filter or export when you need a diligence bundle." as const;

export const AUDIT_TRAIL_TECHNICAL_DETAILS_TITLE = "Technical details" as const;

export const AUDIT_TRAIL_FILTERS_HEADING = "Filters" as const;

export const AUDIT_TRAIL_FILTERS_COLLAPSIBLE_SUMMARY = "Event type, date range, actor, and keyword" as const;

export const AUDIT_TRAIL_FILTERS_EMPTY_HINT = "Open filters to narrow events or switch reviews." as const;

export const AUDIT_TRAIL_EXPORT_ACTION = "Export audit trail" as const;

export const AUDIT_TRAIL_EXPORTING_ACTION = "Exporting…" as const;

export const AUDIT_TRAIL_REFRESH_ACTION = "Refresh" as const;

export const AUDIT_TRAIL_REFRESHING_ACTION = "Refreshing…" as const;

export const AUDIT_TRAIL_OPEN_REVIEW_PACKAGE_ACTION = "Open review" as const;

export const AUDIT_TRAIL_EMPTY_TITLE = "No audit events found" as const;

export const AUDIT_TRAIL_EMPTY_DESCRIPTION =
  "No events match the current review and filter settings." as const;

export const AUDIT_TRAIL_EMPTY_SAMPLE_NOTE =
  "This sample review may not include audit events for the selected filters." as const;

export const AUDIT_TRAIL_EMPTY_CLEAR_FILTERS_ACTION = "Clear filters" as const;

export const AUDIT_TRAIL_EMPTY_CHOOSE_REVIEW_ACTION = "Choose another review" as const;

export const AUDIT_TRAIL_SUMMARY_TOTAL_EVENTS = "Total events" as const;

export const AUDIT_TRAIL_SUMMARY_DECISIONS = "Decisions" as const;

export const AUDIT_TRAIL_SUMMARY_EVIDENCE_CHANGES = "Evidence changes" as const;

export const AUDIT_TRAIL_SUMMARY_APPROVALS = "Approvals" as const;

export const AUDIT_TRAIL_SUMMARY_EXPORTS = "Exports" as const;

export const AUDIT_TRAIL_SUMMARY_LAST_ACTIVITY = "Last activity" as const;

export const AUDIT_TRAIL_EMPTY_PREVIEW_SECTION_TITLE = "What audit entries look like" as const;

/** Live `/governance/audit` table headers — keep aligned with `AUDIT_TRAIL_HELP_ANATOMY_FIELDS`. */
export const AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS = [
  "Occurred",
  "Event",
  "Actor",
  "Review",
  "Correlation",
  "Payload",
] as const;

export const AUDIT_TRAIL_EMPTY_PREVIEW_COLUMNS = AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS;

export const AUDIT_TRAIL_ACTIVE_FILTER_CLEAR = "Clear filters" as const;

export const AUDIT_TRAIL_REVIEW_PACKAGE_SELECTED_CHIP = "Review selected" as const;

export const AUDIT_TRAIL_RESULTS_STATUS_EMPTY = "No audit events in this view" as const;
