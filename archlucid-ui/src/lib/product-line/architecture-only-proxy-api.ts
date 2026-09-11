import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveProductLineId, resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

/**
 * Architecture-only API controllers return 403 from `ProductLineRouteGateMiddleware` when the
 * effective product line is Security (OP-04). Shared shell hooks must not call them.
 */
export function isArchitectureOnlyProxyApiBlocked(productLineId: ProductLineId): boolean {
  return isSecureNowProductLine(productLineId);
}

/** Client-effective product line (cookie shuffle + build env). */
export function shouldSkipArchitectureOnlyProxyApi(productLineId?: ProductLineId): boolean {
  const effective = productLineId ?? resolveProductLineId();

  return isArchitectureOnlyProxyApiBlocked(effective);
}

/** Server / module-init paths without cookie access. */
export function shouldSkipArchitectureOnlyProxyApiFromEnv(): boolean {
  return isArchitectureOnlyProxyApiBlocked(resolveProductLineIdFromEnv());
}
