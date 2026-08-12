import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { BUYER_VALUE_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

/** Canonical URL segment for sponsor value reports (under Insights). */
export const SPONSOR_REPORT_ROOT_SEGMENT = "insights";

export const SPONSOR_REPORT_SECTION_LABEL = "Sponsor report";

/** Page title for sponsor executive summary — matches ValueReportPageView H1 (BUYER_VALUE_REPORT_PAGE_TITLE). */
export const EXECUTIVE_SUMMARY_PAGE_TITLE = BUYER_VALUE_REPORT_PAGE_TITLE;

export const SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH = "/insights/executive-summary";
export const SPONSOR_REPORT_PILOT_OUTCOMES_PATH = "/insights/pilot-outcomes";
export const SPONSOR_REPORT_ROI_SUMMARY_PATH = "/insights/roi-summary";

/** @deprecated Bookmark alias — use {@link SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH}. */
export const LEGACY_SPONSOR_REPORT_ROOT_PATH = "/insights/executive-summary";

/** Architecture scorecard lives under Insights; kept for Outcomes tab strip consumers. */
export const SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH = ARCHITECTURE_SCORECARD_PATH;

export const PILOT_OUTCOMES_PAGE_TITLE = "Pilot outcomes";

export const PILOT_OUTCOMES_PAGE_SUBTITLE =
  "Summarize finalized review activity, material findings, governance decisions, and measurable pilot outcomes for the selected reporting period.";

export function isSponsorReportOutcomesSurface(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    normalized === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH
    || normalized === SPONSOR_REPORT_PILOT_OUTCOMES_PATH
    || normalized === SPONSOR_REPORT_ROI_SUMMARY_PATH
    || normalized === LEGACY_SPONSOR_REPORT_ROOT_PATH
    || normalized === `${LEGACY_SPONSOR_REPORT_ROOT_PATH}/executive-summary`
    || normalized === `${LEGACY_SPONSOR_REPORT_ROOT_PATH}/pilot-outcomes`
    || normalized === `${LEGACY_SPONSOR_REPORT_ROOT_PATH}/roi-summary`
    || normalized.startsWith(`${LEGACY_SPONSOR_REPORT_ROOT_PATH}/`)
    || normalized === ARCHITECTURE_SCORECARD_PATH
    || normalized.startsWith(`${ARCHITECTURE_SCORECARD_PATH}/`)
  );
}
