/** Canonical App Router segment for the sponsor report section. */
export const SPONSOR_REPORT_ROOT_SEGMENT = "sponsor-report";

export const SPONSOR_REPORT_SECTION_LABEL = "Sponsor report";

export const SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH = "/sponsor-report/executive-summary";
export const SPONSOR_REPORT_PILOT_OUTCOMES_PATH = "/sponsor-report/pilot-outcomes";
export const SPONSOR_REPORT_ROI_SUMMARY_PATH = "/sponsor-report/roi-summary";
export const SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH = "/sponsor-report/architecture-scorecard";

export const PILOT_OUTCOMES_PAGE_TITLE = "Pilot outcomes";

export const PILOT_OUTCOMES_PAGE_SUBTITLE =
  "Summarize finalized review activity, material findings, governance decisions, and measurable pilot outcomes for the selected reporting period.";

/**
 * When a URL still uses legacy value-report or scorecard paths, return the canonical sponsor-report path.
 * Query strings are preserved by callers.
 */
export function sponsorReportLegacyRedirectPath(pathname: string): string | null {
  if (pathname.length === 0) {
    return null;
  }

  const normalized = pathname.replace(/\/$/, "") || "/";

  if (normalized === "/value-report/pilot") {
    return SPONSOR_REPORT_PILOT_OUTCOMES_PATH;
  }

  if (normalized === "/value-report/roi") {
    return SPONSOR_REPORT_ROI_SUMMARY_PATH;
  }

  if (normalized === "/value-report") {
    return SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH;
  }

  if (normalized === "/scorecard") {
    return SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH;
  }

  if (normalized === "/sponsor-report") {
    return SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH;
  }

  return null;
}

export function isSponsorReportOutcomesSurface(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    normalized.startsWith("/sponsor-report") ||
    normalized === "/value-report" ||
    normalized.startsWith("/value-report/") ||
    normalized === "/scorecard"
  );
}
