import {
  buildOperatorBillingAddonLines,
  buildOperatorBillingPlanSummaryLines,
  type PricingCatalogLine,
} from "@/lib/pricing-catalog-display";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";

export type OperatorBillingPricingLine = PricingCatalogLine;

export function buildOperatorBillingPricingLines(pricing: PricingDoc, pkg: PricingPackage): OperatorBillingPricingLine[] {
  return buildOperatorBillingPlanSummaryLines(pricing, pkg);
}

export { buildOperatorBillingAddonLines, buildOperatorBillingPlanSummaryLines };
