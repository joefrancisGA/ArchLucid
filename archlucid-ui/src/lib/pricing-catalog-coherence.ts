import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";

export type PricingCatalogUnitRateKind = "seat" | "credit" | "review";

export type PricingCatalogUnitRate = {
  readonly kind: PricingCatalogUnitRateKind;
  readonly usdPerUnit: number;
};

/**
 * Adjacent paid-tier pairs that may worsen a unit rate when ascending.
 * Architect→Team is a solo entry SKU, not an upgrade value ladder (M-200 / TB-1166).
 */
export const PRICING_CATALOG_LADDER_EXCEPTIONS: ReadonlyArray<{
  readonly fromId: string;
  readonly toId: string;
  readonly kinds: ReadonlyArray<PricingCatalogUnitRateKind>;
  readonly reason: string;
}> = [
  {
    fromId: "architect",
    toId: "team",
    kinds: ["seat", "credit", "review"],
    reason: "Architect is a solo entry SKU; Team adds policy packaging, not a cheaper per-unit upgrade.",
  },
];

function includedSeatCount(pkg: PricingPackage): number | null {
  // Buyer-facing seat count is `includedUsers`; `includedArchitectSeats` must match when both are set.
  const seats = pkg.includedUsers ?? pkg.includedArchitectSeats;

  if (typeof seats !== "number" || seats <= 0) {
    return null;
  }

  return seats;
}

export function computePricingCatalogUnitRates(pkg: PricingPackage): PricingCatalogUnitRate[] {
  if (pkg.pricingDisplay === "custom" || typeof pkg.planMonthlyUsd !== "number" || pkg.planMonthlyUsd <= 0) {
    return [];
  }

  const rates: PricingCatalogUnitRate[] = [];
  const seats = includedSeatCount(pkg);

  if (seats !== null) {
    rates.push({ kind: "seat", usdPerUnit: pkg.planMonthlyUsd / seats });
  }

  if (typeof pkg.monthlyAiCredits === "number" && pkg.monthlyAiCredits > 0) {
    rates.push({ kind: "credit", usdPerUnit: pkg.planMonthlyUsd / pkg.monthlyAiCredits });
  }

  if (typeof pkg.includedReviewsPerMonth === "number" && pkg.includedReviewsPerMonth > 0) {
    rates.push({ kind: "review", usdPerUnit: pkg.planMonthlyUsd / pkg.includedReviewsPerMonth });
  }

  return rates;
}

function isLadderException(
  fromId: string,
  toId: string,
  kind: PricingCatalogUnitRateKind,
): boolean {
  return PRICING_CATALOG_LADDER_EXCEPTIONS.some(
    (entry) => entry.fromId === fromId && entry.toId === toId && entry.kinds.includes(kind),
  );
}

export type PricingCatalogLadderViolation = {
  readonly fromId: string;
  readonly toId: string;
  readonly kind: PricingCatalogUnitRateKind;
  readonly lowerUsdPerUnit: number;
  readonly higherUsdPerUnit: number;
};

/** Paid monthly tiers in catalog order — higher tier must not be strictly worse per unit without an exception. */
export function findPricingCatalogLadderViolations(pricing: PricingDoc): PricingCatalogLadderViolation[] {
  const paid = pricing.packages.filter(
    (pkg) => pkg.pricingDisplay !== "custom" && typeof pkg.planMonthlyUsd === "number" && pkg.planMonthlyUsd > 0,
  );

  const violations: PricingCatalogLadderViolation[] = [];

  for (let index = 0; index < paid.length - 1; index += 1) {
    const lower = paid[index];
    const higher = paid[index + 1];

    if (lower === undefined || higher === undefined) {
      continue;
    }

    const lowerRates = computePricingCatalogUnitRates(lower);
    const higherRates = computePricingCatalogUnitRates(higher);

    for (const lowerRate of lowerRates) {
      const higherRate = higherRates.find((rate) => rate.kind === lowerRate.kind);

      if (higherRate === undefined) {
        continue;
      }

      if (higherRate.usdPerUnit <= lowerRate.usdPerUnit + 1e-9) {
        continue;
      }

      if (isLadderException(lower.id, higher.id, lowerRate.kind)) {
        continue;
      }

      violations.push({
        fromId: lower.id,
        toId: higher.id,
        kind: lowerRate.kind,
        lowerUsdPerUnit: lowerRate.usdPerUnit,
        higherUsdPerUnit: higherRate.usdPerUnit,
      });
    }
  }

  return violations;
}

export function assertIncludedUsersMatchArchitectSeats(pricing: PricingDoc): string[] {
  const mismatches: string[] = [];

  for (const pkg of pricing.packages) {
    if (
      typeof pkg.includedUsers === "number" &&
      typeof pkg.includedArchitectSeats === "number" &&
      pkg.includedUsers !== pkg.includedArchitectSeats
    ) {
      mismatches.push(
        `${pkg.id}: includedUsers (${pkg.includedUsers}) !== includedArchitectSeats (${pkg.includedArchitectSeats})`,
      );
    }
  }

  return mismatches;
}
