export function formatExecutiveRoiPricingBasisLabel(
  savingsPricingBasis: string | null | undefined,
  eaDiscountMultiplier: number | null | undefined,
): string {
  const basis = (savingsPricingBasis ?? "Retail").trim();

  switch (basis) {
    case "Uploaded actual/amortized":
      if (typeof eaDiscountMultiplier === "number" && eaDiscountMultiplier < 1) {
        return `Uploaded actual/amortized (EA multiplier ${eaDiscountMultiplier})`;
      }

      return "Uploaded actual/amortized";

    case "EA-adjusted":
      return `EA-adjusted (multiplier ${eaDiscountMultiplier ?? 1})`;

    case "Heuristic fallback":
      return "Heuristic fallback estimates";

    default:
      return "Retail list pricing";
  }
}

export function shouldShowRoiCostEvidenceFreshnessWarning(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim();

  return normalized === "Stale" || normalized === "Missing";
}

export function formatRoiCostEvidenceFreshnessWarning(
  status: string | null | undefined,
  staleAfterDays: number | null | undefined,
  latestCollectionTimestampUtc: string | null | undefined,
): string {
  const normalized = (status ?? "").trim();

  if (normalized === "Stale") {
    const collected =
      typeof latestCollectionTimestampUtc === "string" && latestCollectionTimestampUtc.length > 0
        ? latestCollectionTimestampUtc
        : "unknown";

    return `Uploaded cost evidence is stale (>${String(staleAfterDays ?? 90)} days). Latest collection UTC: ${collected}. Re-run the Azure extractor for current pricing.`;
  }

  if (normalized === "Missing") {
    return "No uploaded extractor cost evidence in this workspace. Savings may rely on Retail catalog or heuristic estimates.";
  }

  return "";
}
