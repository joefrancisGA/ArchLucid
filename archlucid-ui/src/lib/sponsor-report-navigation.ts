import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { BUYER_VALUE_REPORT_PAGE_TITLE } from "@/lib/buyer-polish-copy";

/** Canonical browser path for the sponsor report section. */
export const SPONSOR_REPORT_ROOT_SEGMENT = "sponsor-report";

export const SPONSOR_REPORT_SECTION_LABEL = "Sponsor report";

/** Page title for sponsor executive summary — matches ValueReportPageView H1 (BUYER_VALUE_REPORT_PAGE_TITLE). */
export const EXECUTIVE_SUMMARY_PAGE_TITLE = BUYER_VALUE_REPORT_PAGE_TITLE;

export const SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH = "/sponsor-report/executive-summary";
export const SPONSOR_REPORT_PILOT_OUTCOMES_PATH = "/sponsor-report/pilot-outcomes";
export const SPONSOR_REPORT_ROI_SUMMARY_PATH = "/sponsor-report/roi-summary";

/** Architecture scorecard lives under Insights; kept for Outcomes tab strip consumers. */
export const SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH = ARCHITECTURE_SCORECARD_PATH;

export const PILOT_OUTCOMES_PAGE_TITLE = "Pilot outcomes";

export const PILOT_OUTCOMES_PAGE_SUBTITLE =
  "Summarize finalized review activity, material findings, governance decisions, and measurable pilot outcomes for the selected reporting period.";

export function isSponsorReportOutcomesSurface(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    normalized.startsWith("/sponsor-report") ||
    normalized === ARCHITECTURE_SCORECARD_PATH ||
    normalized.startsWith(`${ARCHITECTURE_SCORECARD_PATH}/`)
  );
}
