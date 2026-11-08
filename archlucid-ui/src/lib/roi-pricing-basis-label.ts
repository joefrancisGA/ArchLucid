import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";

export const SPONSOR_ROI_PRICING_BASIS_NOT_STORED = "Savings pricing basis was not stored." as const;

export const SPONSOR_ROI_EA_MULTIPLIER_NOT_STORED = "EA discount multiplier was not stored." as const;

export function formatSponsorRoiPricingBasisLabel(
  savingsPricingBasis: string | null | undefined,
  eaDiscountMultiplier: number | null | undefined,
): string {
  const basisTrimmed = savingsPricingBasis?.trim() ?? "";

  if (basisTrimmed.length === 0) {
    return SPONSOR_ROI_PRICING_BASIS_NOT_STORED;
  }

  switch (basisTrimmed) {
    case "Uploaded actual/amortized":
      if (typeof eaDiscountMultiplier === "number" && Number.isFinite(eaDiscountMultiplier) && eaDiscountMultiplier < 1) {
        return `Uploaded actual/amortized (EA multiplier ${eaDiscountMultiplier})`;
      }

      if (typeof eaDiscountMultiplier !== "number" || !Number.isFinite(eaDiscountMultiplier)) {
        return `Uploaded actual/amortized (${SPONSOR_ROI_EA_MULTIPLIER_NOT_STORED})`;
      }

      return "Uploaded actual/amortized";

    case "EA-adjusted":
      if (typeof eaDiscountMultiplier === "number" && Number.isFinite(eaDiscountMultiplier)) {
        return `EA-adjusted (multiplier ${eaDiscountMultiplier})`;
      }

      return `EA-adjusted (${SPONSOR_ROI_EA_MULTIPLIER_NOT_STORED})`;

    case "Heuristic fallback":
      return "Heuristic fallback estimates";

    default:
      return basisTrimmed;
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

    return `Uploaded cost evidence is stale (>${String(staleAfterDays ?? 90)} days). Latest collection UTC: ${collected}. ${CLOUD_NEUTRAL_PRIMARY_COPY.roiStaleInventoryHint}`;
  }

  if (normalized === "Missing") {
    return "Cost baseline not configured. Savings may rely on Retail catalog or heuristic estimates until you upload cloud cost evidence from an inventory ZIP.";
  }

  return "";
}
