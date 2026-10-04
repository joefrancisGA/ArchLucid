/** Per-theme count from sponsor ROI summary — omitting a field is not a measured zero. */
export function presentBusinessImpactThemeCount(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not returned";
  }

  return String(Math.max(0, Math.trunc(value)));
}

export type BusinessImpactThemeCountsPresentation = {
  readonly security: string;
  readonly compliance: string;
  readonly securityCompliance: string;
  readonly reliability: string;
  readonly cost: string;
  readonly governance: string;
  readonly other: string;
};

export function presentBusinessImpactThemeCounts(
  counts: {
    readonly securityThemeCount?: number;
    readonly complianceThemeCount?: number;
    readonly securityComplianceThemeCount?: number;
    readonly reliabilityThemeCount?: number;
    readonly costThemeCount?: number;
    readonly governanceThemeCount?: number;
    readonly otherThemeCount?: number;
  } | null
  | undefined,
): BusinessImpactThemeCountsPresentation {
  const c = counts ?? {};

  return {
    security: presentBusinessImpactThemeCount(c.securityThemeCount),
    compliance: presentBusinessImpactThemeCount(c.complianceThemeCount),
    securityCompliance: presentBusinessImpactThemeCount(c.securityComplianceThemeCount),
    reliability: presentBusinessImpactThemeCount(c.reliabilityThemeCount),
    cost: presentBusinessImpactThemeCount(c.costThemeCount),
    governance: presentBusinessImpactThemeCount(c.governanceThemeCount),
    other: presentBusinessImpactThemeCount(c.otherThemeCount),
  };
}
