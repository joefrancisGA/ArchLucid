/** Server-authoritative ROI scope codes (mirrors ArchLucid.Contracts.Roi.RoiSponsorFacingScopeCodes). */
export const ROI_SPONSOR_SCOPE_CODES = {
  headlineDispositionAware: "headline-disposition-aware-open-needs-evidence",
  systemRowSnapshotPotential: "per-system-latest-run-snapshot-potential",
  crossTenantPortfolioHeadline: "cross-tenant-portfolio-headline",
  valueReportActivityWindow: "tenant-activity-window-hours-roi-model",
  trailing30DayFindingEvents: "trailing-30d-utc-finding-events",
  pilotScorecardUtcWindow: "pilot-scorecard-utc-window",
} as const;

export type RoiScopeLabelSource = {
  headlineSavingsScopeDescription?: string | null;
  systemRowSavingsScopeDescription?: string | null;
  trailing30DayActivityScopeDescription?: string | null;
};

/** Prefer API scope labels; fall back to stable copy when older payloads omit fields. */
export function resolveExecutiveHeadlineScopeLabel(source: RoiScopeLabelSource): string {
  if (source.headlineSavingsScopeDescription?.trim()) {
    return source.headlineSavingsScopeDescription.trim();
  }

  return "Portfolio headline: disposition-aware open + needs-evidence estimated USD from latest committed run per system.";
}

export function resolveExecutiveSystemRowScopeLabel(source: RoiScopeLabelSource): string {
  if (source.systemRowSavingsScopeDescription?.trim()) {
    return source.systemRowSavingsScopeDescription.trim();
  }

  return "Per-system rows are pre-disposition snapshot components and do not sum to the portfolio headline.";
}

export function resolveExecutiveTrailing30DayScopeLabel(source: RoiScopeLabelSource): string {
  if (source.trailing30DayActivityScopeDescription?.trim()) {
    return source.trailing30DayActivityScopeDescription.trim();
  }

  return "Trailing 30-day UTC finding activity counts (not USD savings).";
}
