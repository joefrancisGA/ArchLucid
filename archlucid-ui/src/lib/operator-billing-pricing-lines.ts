import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";

export type OperatorBillingPricingLine = {
  label: string;
  value: string;
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildOperatorBillingPricingLines(pricing: PricingDoc, pkg: PricingPackage): OperatorBillingPricingLine[] {
  const lines: OperatorBillingPricingLine[] = [];

  if (typeof pkg.workspaceMonthlyUsd === "number") {
    lines.push({
      label: "Workspace platform",
      value: `${formatMoney(pkg.workspaceMonthlyUsd, pricing.currency)} / mo`,
    });
  }

  if (typeof pkg.maxWorkspaces === "number") {
    lines.push({
      label: "Workspaces (cap)",
      value: String(pkg.maxWorkspaces),
    });
  }

  if (typeof pkg.includedArchitectSeats === "number") {
    lines.push({
      label: "Included architect seats",
      value: String(pkg.includedArchitectSeats),
    });
  }

  if (typeof pkg.includedReviewsPerMonth === "number") {
    lines.push({
      label: "Included reviews",
      value: `${pkg.includedReviewsPerMonth} / month`,
    });
  }

  if (typeof pkg.overageReviewUsd === "number") {
    lines.push({
      label: "Additional reviews",
      value: `${formatMoney(pkg.overageReviewUsd, pricing.currency)} / review`,
    });
  }

  if (typeof pkg.seatMonthlyUsd === "number") {
    lines.push({
      label: "Additional architect seats",
      value: `${formatMoney(pkg.seatMonthlyUsd, pricing.currency)} / seat / mo`,
    });
  }

  if (typeof pkg.annualFloorUsd === "number") {
    lines.push({
      label: "Annual contract",
      value: `Starting at ${formatMoney(pkg.annualFloorUsd, pricing.currency)} / year`,
    });
  }

  return lines;
}
