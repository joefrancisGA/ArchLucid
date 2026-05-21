/** Derives an annualized architecture cost baseline for what-if analysis on the run detail page. */
export function deriveRunDetailBaselineAnnualCostUsd(params: {
  readonly savingsSummaryAnnualizedUsd: number | null | undefined;
  readonly goldenManifestJson: unknown | null | undefined;
}): number | null {
  if (typeof params.savingsSummaryAnnualizedUsd === "number" && Number.isFinite(params.savingsSummaryAnnualizedUsd)) {
    return params.savingsSummaryAnnualizedUsd;
  }

  if (params.goldenManifestJson === null || params.goldenManifestJson === undefined || typeof params.goldenManifestJson !== "object") {
    return null;
  }

  const cost = (params.goldenManifestJson as { cost?: { maxMonthlyCost?: unknown } }).cost?.maxMonthlyCost;

  if (typeof cost === "number" && Number.isFinite(cost))
    return cost * 12;

  return null;
}
