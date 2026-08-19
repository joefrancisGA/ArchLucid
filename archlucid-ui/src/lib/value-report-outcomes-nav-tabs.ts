import {
  LEGACY_SPONSOR_REPORT_ROOT_PATH,
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";
import { BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export type ValueReportOutcomesTab = {
  readonly href: string;
  readonly label: string;
  readonly match: (path: string) => boolean;
  /** Hidden from customer-facing tab strips unless system-administration nav is enabled. */
  readonly internalOnly?: boolean;
};

function normalizeOutcomesPath(path: string): string {
  return path.replace(/\/$/, "") || "/";
}

function matchesSponsorReport(path: string): boolean {
  const normalized = normalizeOutcomesPath(path);

  return (
    normalized === SPONSOR_REPORT_PATH
    || normalized === LEGACY_SPONSOR_REPORT_ROOT_PATH
    || normalized === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH
  );
}

function matchesRoiSummary(path: string): boolean {
  const normalized = normalizeOutcomesPath(path);

  return normalized === SPONSOR_REPORT_ROI_SUMMARY_PATH;
}

function matchesArchitectureScorecard(path: string): boolean {
  const normalized = normalizeOutcomesPath(path);

  return (
    normalized === SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH
    || normalized.startsWith(`${SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH}/`)
  );
}

export const VALUE_REPORT_OUTCOMES_TABS: readonly ValueReportOutcomesTab[] = [
  {
    href: SPONSOR_REPORT_PATH,
    label: SPONSOR_REPORT_PAGE_TITLE,
    match: matchesSponsorReport,
  },
  {
    href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
    label: "ROI summary",
    match: matchesRoiSummary,
  },
  {
    href: SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
    label: BUYER_TERMINOLOGY.reviewScorecard,
    match: matchesArchitectureScorecard,
  },
] as const;

/**
 * ROI summary moved from Internal Operations to the Insights sidebar group (nav placement audit,
 * 2026-07-05) — it hits `RequiresCommercialTenantTier` + ReadAuthority endpoints, same as the sponsor
 * report and Sponsor scorecard, so the tab strip no longer hides it behind
 * `showSystemAdministrationNav` (was TB-605). The standalone pilot outcomes tab retired when that page
 * merged into the sponsor report.
 */
export function resolveVisibleValueReportOutcomesTabs(
  showSystemAdministrationNav: boolean,
): readonly ValueReportOutcomesTab[] {
  return VALUE_REPORT_OUTCOMES_TABS.filter(
    (tab) => !tab.internalOnly || showSystemAdministrationNav,
  );
}

export function isValueReportOutcomesSurface(pathname: string): boolean {
  return VALUE_REPORT_OUTCOMES_TABS.some((tab) => tab.match(pathname));
}

/** Section label for breadcrumbs and exports — canonical sponsor report naming. */
export const SPONSOR_REPORT_OUTCOMES_SECTION_LABEL = SPONSOR_REPORT_SECTION_LABEL;
