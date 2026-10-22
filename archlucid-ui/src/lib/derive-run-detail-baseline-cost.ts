/** Derives an annualized architecture cost baseline for what-if analysis on the run detail page. */
export function deriveRunDetailBaselineAnnualCostUsd(params: {
  readonly savingsSummaryAnnualizedUsd: number | null | undefined;
  readonly goldenManifestJson: unknown | null | undefined;
}): { baselineAnnualCostUsd: number | null; isIllustrativePricing: boolean } {
  let isIllustrativePricing = false;
  let baselineAnnualCostUsd: number | null = null;

  if (params.goldenManifestJson !== null && params.goldenManifestJson !== undefined && typeof params.goldenManifestJson === "object") {
    const costObj = (params.goldenManifestJson as { cost?: { maxMonthlyCost?: unknown; isIllustrativePricing?: boolean } }).cost;
    if (costObj) {
      if (typeof costObj.isIllustrativePricing === "boolean") {
        isIllustrativePricing = costObj.isIllustrativePricing;
      }
      if (typeof costObj.maxMonthlyCost === "number" && Number.isFinite(costObj.maxMonthlyCost)) {
        baselineAnnualCostUsd = costObj.maxMonthlyCost * 12;
      }
    }
  }

  if (baselineAnnualCostUsd === null && typeof params.savingsSummaryAnnualizedUsd === "number" && Number.isFinite(params.savingsSummaryAnnualizedUsd)) {
    baselineAnnualCostUsd = params.savingsSummaryAnnualizedUsd;
  }

  return { baselineAnnualCostUsd, isIllustrativePricing };
}
