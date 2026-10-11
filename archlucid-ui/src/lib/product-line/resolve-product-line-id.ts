import { lockProductLineForSecureNowEdition } from "@/lib/editions/lock-product-line-for-securenow-edition";
import { DEFAULT_PRODUCT_LINE_ID, isProductLineId, type ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_ENV_NAME } from "@/lib/product-line/product-line-copy";
import { readProductLineCookie } from "@/lib/product-line/product-line-storage";
import { isSecureNowUhgEdition } from "@/lib/product-line/resolve-securenow-edition-id";

/** Build-time default from `NEXT_PUBLIC_ARCHLUCID_PRODUCT`. Missing or invalid → Architecture. */
export function resolveProductLineIdFromEnv(): ProductLineId {
  const raw = (process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT ?? "").trim().toLowerCase();
  const fromEnv = isProductLineId(raw) ? raw : DEFAULT_PRODUCT_LINE_ID;

  return lockProductLineForSecureNowEdition(fromEnv);
}

/**
 * Effective product shell: browser cookie (dev shuffle) wins over the build env.
 * The UHG edition ignores that cookie and stays on SecureNow.
 * Safe on the server — cookie read no-ops when `document` is missing.
 */
export function resolveProductLineId(): ProductLineId {
  if (isSecureNowUhgEdition()) {
    return "security";
  }

  const cookieProduct = readProductLineCookie();

  if (cookieProduct !== null) {
    return lockProductLineForSecureNowEdition(cookieProduct);
  }

  return resolveProductLineIdFromEnv();
}

export { PRODUCT_LINE_ENV_NAME };
