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
    internalOnly: true,
  },
  {
    href: "/value-report/roi",
    label: "ROI summary",
    match: (path: string) => path.startsWith("/value-report/roi"),
    internalOnly: true,
  },
  {
    href: "/scorecard",
    label: "Executive scorecard",
    match: (path: string) => path.startsWith("/scorecard"),
  },
] as const;

/** Mirrors sidebar `operator-system-admin` gating for internal ROI/pilot value-report variants (TB-605). */
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
