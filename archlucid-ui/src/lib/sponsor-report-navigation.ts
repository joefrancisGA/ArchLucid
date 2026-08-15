import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SPONSOR_REPORT_PAGE_TITLE as BUYER_SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

/** Canonical URL segment for sponsor value reports (under Insights). */
export const SPONSOR_REPORT_ROOT_SEGMENT = "insights";

/**
 * Metadata / breadcrumb section for the sponsor-report family. This is the nav group name, not the
 * page name — the merged report page is itself titled "Sponsor report", so the section must differ
 * to avoid rendering "Sponsor report | Sponsor report".
 */
export const SPONSOR_REPORT_SECTION_LABEL = "Insights";

/** Canonical H1 + nav label for the merged sponsor report. */
export const SPONSOR_REPORT_PAGE_TITLE = BUYER_SPONSOR_REPORT_PAGE_TITLE;

export const SPONSOR_REPORT_PAGE_SUBTITLE =
  "Summarize finalized review activity, material findings, governance decisions, and measurable outcomes for the selected reporting period, then export the sponsor report.";

export const SPONSOR_REPORT_PATH = "/insights/sponsor-report";
export const SPONSOR_REPORT_ROI_SUMMARY_PATH = "/insights/roi-summary";

/**
 * Hard-retired route. The standalone pilot outcomes page merged into
 * {@link SPONSOR_REPORT_PATH} — both rendered the same `pilot-value-report` payload
 * over the same reporting period. Retired without a redirect, so this constant exists only for
 * host-gate legacy forwarding and retirement guards. Never link to it.
 */
export const RETIRED_PILOT_OUTCOMES_PATH = "/insights/pilot-outcomes";

/** @deprecated Legacy bookmark — use {@link SPONSOR_REPORT_PATH}. */
export const LEGACY_SPONSOR_REPORT_ROOT_PATH = "/sponsor-report";

/** @deprecated Legacy path before sponsor-report canonicalization. */
export const SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH = "/insights/executive-summary";

/**
 * Hard-retired route. Former `/insights/sponsor-summary` bookmark — canonical is
 * {@link SPONSOR_REPORT_PATH}. Retired without a redirect; constant for host-gate and retirement guards.
 */
export const RETIRED_SPONSOR_SUMMARY_PATH = "/insights/sponsor-summary";

/**
 * Hard-retired route. Former `/value-report/roi` bookmark (IA batch 4) — canonicalizes to
 * {@link SPONSOR_REPORT_ROI_SUMMARY_PATH} for help and orientation lookups. Never link to it.
 */
export const RETIRED_ROI_SUMMARY_PATH = "/value-report/roi";

/** Architecture scorecard lives under Insights; kept for Outcomes tab strip consumers. */
export const SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH = ARCHITECTURE_SCORECARD_PATH;

export function isSponsorReportOutcomesSurface(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";

  return (
    normalized === SPONSOR_REPORT_PATH
    || normalized === SPONSOR_REPORT_ROI_SUMMARY_PATH
    || normalized === LEGACY_SPONSOR_REPORT_ROOT_PATH
    || normalized === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH
    || normalized === `${LEGACY_SPONSOR_REPORT_ROOT_PATH}/sponsor-report`
    || normalized === `${LEGACY_SPONSOR_REPORT_ROOT_PATH}/roi-summary`
    || normalized.startsWith(`${LEGACY_SPONSOR_REPORT_ROOT_PATH}/`)
    || normalized === ARCHITECTURE_SCORECARD_PATH
    || normalized.startsWith(`${ARCHITECTURE_SCORECARD_PATH}/`)
  );
}
