import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

export type ValueReportOutcomesTab = {
  readonly href: string;
  readonly label: string;
  readonly match: (path: string) => boolean;
  /** Hidden from customer-facing tab strips unless system-administration nav is enabled. */
  readonly internalOnly?: boolean;
};

export const VALUE_REPORT_OUTCOMES_TABS: readonly ValueReportOutcomesTab[] = [
  {
    href: "/value-report",
    label: "Sponsor report",
    match: (path: string) => path === "/value-report",
  },
  {
    href: "/value-report/pilot",
    label: "Pilot outcomes",
    match: (path: string) => path.startsWith("/value-report/pilot"),
  },
  {
    href: "/value-report/roi",
    label: "ROI summary",
    match: (path: string) => path.startsWith("/value-report/roi"),
  },
  {
    href: "/scorecard",
    label: BUYER_TERMINOLOGY.reviewScorecard,
    match: (path: string) => path.startsWith("/scorecard"),
  },
] as const;

/**
 * Pilot outcomes and ROI summary moved from Internal Operations to the Reports sidebar group (nav placement
 * audit, 2026-07-05) — both hit `RequiresCommercialTenantTier` + ReadAuthority endpoints, same as Sponsor report
 * and Executive scorecard, so the tab strip no longer hides them behind `showSystemAdministrationNav` (was TB-605).
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
