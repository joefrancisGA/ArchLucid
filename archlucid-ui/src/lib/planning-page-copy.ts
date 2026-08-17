import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

export const IMPROVEMENT_PLANNING_PAGE_TITLE = "Improvement planning" as const;

export const IMPROVEMENT_PLANNING_PAGE_SUBTITLE =
  "Convert review feedback into recurring themes, prioritized improvement plans, and exportable action summaries." as const;

export const IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER =
  "Recurring themes and prioritized plans from captured review feedback." as const;

export function planningPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER : IMPROVEMENT_PLANNING_PAGE_SUBTITLE;
}

export const IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO =
  "Planning insights are generated from captured review feedback." as const;

export const IMPROVEMENT_PLANNING_SCOPE_LINE =
  "Showing planning insights for the current workspace and selected project." as const;

export const IMPROVEMENT_PLANNING_SCOPE_DETAILS_TRIGGER = "About planning scope" as const;

export const IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_TITLE = "Technical scope details" as const;

export const IMPROVEMENT_PLANNING_TECHNICAL_SCOPE_BODY =
  "Planning insights respect the active workspace and project selected in the header switcher. Switch scope there to compare a different project." as const;

export const IMPROVEMENT_PLANNING_EMPTY_TITLE = "No improvement plans yet" as const;

export const IMPROVEMENT_PLANNING_EMPTY_DESCRIPTION =
  "Capture review feedback or run pilot feedback analysis to generate themes and prioritized plans." as const;

export const IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_CTA = "Capture review feedback" as const;

export const IMPROVEMENT_PLANNING_RUN_PILOT_FEEDBACK_CTA = "Run pilot feedback" as const;

export const IMPROVEMENT_PLANNING_VIEW_REVIEWS_CTA = "View reviews" as const;

export const IMPROVEMENT_PLANNING_FEEDBACK_SIGNALS_LABEL = "Feedback signals" as const;

export const IMPROVEMENT_PLANNING_SIGNALS_LINKED_LABEL = "Signals linked to plans" as const;

export const IMPROVEMENT_PLANNING_HIGHEST_PRIORITY_LABEL = "Highest plan priority" as const;

export const IMPROVEMENT_PLANNING_NO_FEEDBACK_SIGNALS_DETAIL = "No feedback signals captured yet" as const;

export const IMPROVEMENT_PLANNING_NO_PLANS_LINKED_DETAIL = "No plans generated yet" as const;

export const IMPROVEMENT_PLANNING_NO_PRIORITY_DETAIL = "Priority appears after plans are generated" as const;

export const IMPROVEMENT_PLANNING_THEMES_EMPTY_MESSAGE =
  "Themes will appear after feedback is captured and analyzed." as const;

export const IMPROVEMENT_PLANNING_PLANS_EMPTY_MESSAGE = "Plans will appear after themes are identified." as const;

export const IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE = "Export planning summary" as const;

export const IMPROVEMENT_PLANNING_EXPORT_SECTION_DESCRIPTION =
  "Download a shareable summary of themes and prioritized plans for stakeholders." as const;

export const IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA = "Download planning report" as const;

export const IMPROVEMENT_PLANNING_EXPORT_DATA_CTA = "Export data" as const;

export const IMPROVEMENT_PLANNING_TECHNICAL_EXPORT_TITLE = "Technical export options" as const;

export const IMPROVEMENT_PLANNING_REFRESH_LABEL = "Refresh" as const;

export const IMPROVEMENT_PLANNING_REFRESHING_LABEL = "Refreshing…" as const;

export const IMPROVEMENT_PLANNING_LAST_UPDATED_PREFIX = "Last updated" as const;

export const IMPROVEMENT_PLANNING_LOADING_STATUS = "Loading improvement planning…";

export const IMPROVEMENT_PLANNING_LOAD_RETRY_LABEL = "Try again";

export const IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_TITLE = "No plans match this theme";

export const IMPROVEMENT_PLANNING_THEME_FILTER_NO_MATCH_BODY =
  "Try another theme or show all plans to browse the full prioritized list.";

export const IMPROVEMENT_PLANNING_SHOW_ALL_PLANS = "Show all plans" as const;

export const IMPROVEMENT_PLANNING_THEME_ID_LABEL = "Theme id" as const;

export const IMPROVEMENT_PLANNING_FAILURE_TRY_NEXT =
  "Confirm planning is enabled for this workspace, then refresh. Capture review feedback first if this workspace is new." as const;

export const IMPROVEMENT_PLANNING_DEMO_DESCRIPTION =
  "In a connected tenant, browse improvement themes and prioritized plans derived from captured review feedback." as const;

export const IMPROVEMENT_PLANNING_CAPTURE_FEEDBACK_HREF = PRODUCT_LEARNING_PATH;

export const IMPROVEMENT_PLANNING_VIEW_REVIEWS_HREF = "/architecture/reviews" as const;
