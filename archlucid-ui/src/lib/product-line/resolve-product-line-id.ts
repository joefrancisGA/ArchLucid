import { DEFAULT_PRODUCT_LINE_ID, isProductLineId, type ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_ENV_NAME } from "@/lib/product-line/product-line-copy";
import { readProductLineCookie } from "@/lib/product-line/product-line-storage";

/** Build-time default from `NEXT_PUBLIC_ARCHLUCID_PRODUCT`. Missing or invalid → Architecture. */
export function resolveProductLineIdFromEnv(): ProductLineId {
  const raw = (process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT ?? "").trim().toLowerCase();

  if (isProductLineId(raw)) {
    return raw;
  }

  return DEFAULT_PRODUCT_LINE_ID;
}

/**
 * Effective product shell: browser cookie (dev shuffle) wins over the build env.
 * Safe on the server — cookie read no-ops when `document` is missing.
 */
export function resolveProductLineId(): ProductLineId {
  const cookieProduct = readProductLineCookie();

  if (cookieProduct !== null) {
    return cookieProduct;
  }

  return resolveProductLineIdFromEnv();
}

export { PRODUCT_LINE_ENV_NAME };
