import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_LABELS } from "@/lib/product-line/product-line-copy";

export const PRODUCT_LINE_ENTITLEMENT_NOT_IN_PLAN_HEADING = "Not in your current product shell" as const;

export function resolveProductLineRouteBlockedEntitlementEmptyLine(input: {
  readonly activeProductLine: ProductLineId;
  readonly switchToProductLine: ProductLineId | null;
}): string {
  if (input.switchToProductLine === null) {
    return `This destination is not bundled in the ${PRODUCT_LINE_LABELS[input.activeProductLine]} shell you are signed in to.`;
  }

  return `${PRODUCT_LINE_ENTITLEMENT_NOT_IN_PLAN_HEADING}: open it in the ${PRODUCT_LINE_LABELS[input.switchToProductLine]} shell, or request SecureNow SKU entitlements if packaging blocks access.`;
}
