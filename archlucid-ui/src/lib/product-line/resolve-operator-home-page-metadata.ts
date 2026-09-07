import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { SECURITY_PRODUCT_HOME_TITLE } from "@/lib/product-line/product-line-copy";

/** Browser tab title for `/` in each product-line process (build env, not cookie). */
export function resolveOperatorHomePageMetadataTitle(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURITY_PRODUCT_HOME_TITLE;
  }

  return OPERATOR_NAV_LINK_LABELS.home;
}
