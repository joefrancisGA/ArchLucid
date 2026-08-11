import {
  BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL,
  BILLING_CUSTOM_AI_ALLOWANCE_VALUE,
  BILLING_INCLUDED_AI_CREDITS_LABEL,
  BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
} from "@/lib/vocabulary/billing-meter-vocabulary";
import {
  MARKETING_PRICING_TIER_ORDER,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";

export type PricingCatalogLine = {
  readonly label: string;
  readonly value: string;
};

export function formatPricingMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Human-readable catalog effective date for billing tier footers (TB-1170). */
export function formatPricingCatalogEffectiveDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function pricingTierSortIndex(id: string): number {
  const index = MARKETING_PRICING_TIER_ORDER.indexOf(id as MarketingPricingTierId);

  return index >= 0 ? index : 99;
}

export function sortPricingPackages(packages: readonly PricingPackage[]): PricingPackage[] {
  return [...packages].sort((left, right) => pricingTierSortIndex(left.id) - pricingTierSortIndex(right.id));
}

/** Buyer-facing bundled monthly price — shared by public pricing and in-app billing. */
export function formatPlanPrice(pkg: PricingPackage, currency: string): string {
  if (pkg.pricingDisplay === "custom") {
    return "Custom";
  }

  if (typeof pkg.planMonthlyUsd === "number") {
    return `${formatPricingMoney(pkg.planMonthlyUsd, currency)} / mo`;
  }

  return "Contact us";
}

export function formatIncludedUsersAndWorkspaces(pkg: PricingPackage): string | null {
  const users = pkg.includedUsers ?? pkg.includedArchitectSeats;
  const workspaces =
    pkg.includedWorkspaces ??
    (pkg.maxWorkspaces !== undefined && pkg.maxWorkspaces > 0 ? pkg.maxWorkspaces : undefined);

  if (users === undefined && workspaces === undefined) {
    return null;
  }

  const userLabel = users === 1 ? "1 user" : users !== undefined && users > 0 ? `${users} users` : null;
  const workspaceLabel =
    workspaces === 1 ? "1 workspace" : workspaces !== undefined && workspaces > 0 ? `${workspaces} workspaces` : null;

  if (userLabel !== null && workspaceLabel !== null) {
    return `${userLabel} · ${workspaceLabel}`;
  }

  if (userLabel !== null) {
    return userLabel;
  }

  if (workspaceLabel !== null) {
    return workspaceLabel;
  }

  return null;
}

export function formatMonthlyAiCredits(pkg: PricingPackage): string | null {
  if (pkg.pricingDisplay === "custom") {
    return BILLING_CUSTOM_AI_ALLOWANCE_VALUE;
  }

  if (typeof pkg.monthlyAiCredits === "number" && pkg.monthlyAiCredits > 0) {
    return `${pkg.monthlyAiCredits.toLocaleString()} AI credits / month`;
  }

  return null;
}

export function formatIncludedArchitecturePackagesPerMonth(pkg: PricingPackage): string | null {
  if (typeof pkg.includedReviewsPerMonth !== "number" || pkg.includedReviewsPerMonth <= 0) {
    return null;
  }

  return `${pkg.includedReviewsPerMonth} architecture reviews / month`;
}

/** Primary plan summary lines for in-app billing cards — mirrors public pricing, not legacy SKUs. */
export function buildOperatorBillingPlanSummaryLines(
  pricing: PricingDoc,
  pkg: PricingPackage,
): PricingCatalogLine[] {
  const lines: PricingCatalogLine[] = [
    {
      label: "Plan price",
      value: formatPlanPrice(pkg, pricing.currency),
    },
  ];

  const includedLine = formatIncludedUsersAndWorkspaces(pkg);

  if (includedLine !== null) {
    lines.push({
      label: "Included",
      value: includedLine,
    });
  }

  const aiCreditsLine = formatMonthlyAiCredits(pkg);

  if (aiCreditsLine !== null) {
    lines.push({
      label: BILLING_INCLUDED_AI_CREDITS_LABEL,
      value: aiCreditsLine,
    });
  }

  if (typeof pkg.includedReviewsPerMonth === "number" && pkg.includedReviewsPerMonth > 0) {
    lines.push({
      label: BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
      value: `${pkg.includedReviewsPerMonth} / month`,
    });
  }

  return lines;
}

/** Optional add-on lines — collapsed on billing cards; never shown as primary packaging. */
export function buildOperatorBillingAddonLines(pricing: PricingDoc, pkg: PricingPackage): PricingCatalogLine[] {
  const lines: PricingCatalogLine[] = [];

  if (typeof pkg.overageReviewUsd === "number") {
    lines.push({
      label: BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
      value: `${formatPricingMoney(pkg.overageReviewUsd, pricing.currency)} / ${BILLING_ARCHITECTURE_PACKAGE_OVERAGE_UNIT_LABEL}`,
    });
  }

  if (typeof pkg.seatMonthlyUsd === "number") {
    const seatCapSuffix =
      typeof pkg.maxArchitectSeats === "number" && pkg.maxArchitectSeats > 0
        ? ` (plan max ${pkg.maxArchitectSeats} seats)`
        : "";

    lines.push({
      label: "Additional users",
      value: `${formatPricingMoney(pkg.seatMonthlyUsd, pricing.currency)} / user / mo${seatCapSuffix}`,
    });
  }

  if (typeof pkg.workspaceMonthlyUsd === "number") {
    lines.push({
      label: "Additional workspaces",
      value: `${formatPricingMoney(pkg.workspaceMonthlyUsd, pricing.currency)} / workspace / mo`,
    });
  }

  return lines;
}
