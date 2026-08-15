import manifest from "@/lib/data/roi-sponsor-facing-scope-labels.v1.json";

/** Server-authoritative ROI scope codes (mirrors ArchLucid.Contracts.Roi.RoiSponsorFacingScopeCodes). */
export const ROI_SPONSOR_SCOPE_CODES = {
  headlineDispositionAware: manifest.codes.headlineDispositionAware,
  systemRowSnapshotPotential: manifest.codes.systemRowSnapshotPotential,
  crossTenantPortfolioHeadline: manifest.codes.crossTenantPortfolioHeadline,
  valueReportActivityWindow: manifest.codes.valueReportActivityWindow,
  trailing30DayFindingEvents: manifest.codes.trailing30DayFindingEvents,
  pilotScorecardUtcWindow: manifest.codes.pilotScorecardUtcWindow,
} as const;

export const ROI_NON_ADDITIVITY_CAVEAT = manifest.nonAdditivityCaveat;

export type RoiScopeLabelSource = {
  headlineSavingsScopeDescription?: string | null;
  systemRowSavingsScopeDescription?: string | null;
  trailing30DayActivityScopeDescription?: string | null;
};

/** Prefer API scope labels; fall back to canonical manifest copy when older payloads omit fields. */
export function resolveSponsorHeadlineScopeLabel(source: RoiScopeLabelSource): string {
  if (source.headlineSavingsScopeDescription?.trim()) {
    return source.headlineSavingsScopeDescription.trim();
  }

  return manifest.descriptions.headlineDispositionAware;
}

export function resolveSponsorSystemRowScopeLabel(source: RoiScopeLabelSource): string {
  if (source.systemRowSavingsScopeDescription?.trim()) {
    return source.systemRowSavingsScopeDescription.trim();
  }

  return manifest.descriptions.systemRowSnapshotPotential;
}

export function resolveSponsorTrailing30DayScopeLabel(source: RoiScopeLabelSource): string {
  if (source.trailing30DayActivityScopeDescription?.trim()) {
    return source.trailing30DayActivityScopeDescription.trim();
  }

  return manifest.descriptions.trailing30DayFindingEvents;
}
